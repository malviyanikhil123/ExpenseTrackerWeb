import { eq } from "drizzle-orm";
import { db } from "../index";
import { categoryIcons } from "../schema/categoryIcons";
import { categoryGroups } from "../schema/categoryGroups";
import { categories } from "../schema/categories";
import { defaultCategoriesSeed } from "./default-categories.seed";

function getDefaultCategories() {
    return Object.entries(defaultCategoriesSeed).flatMap(([type, categoryList]) =>
        categoryList.map((category) => ({
            ...category,
            type: type as "INCOME" | "EXPENSE",
        }))
    );
}

export async function seedDefaultCategoriesForUser(userId: string) {
    const createdIcons = await db.select({
        iconId: categoryIcons.id,
        iconKey: categoryIcons.iconKey,
        groupName: categoryGroups.name,
    })
        .from(categoryIcons)
        .leftJoin(categoryGroups, eq(categoryIcons.groupId, categoryGroups.id));

    const iconByKey = new Map(createdIcons.map((icon) => [icon.iconKey, icon.iconId]));
    const fallbackIconByGroup = new Map<string, string>();

    for (const icon of createdIcons) {
        if (icon.groupName && !fallbackIconByGroup.has(icon.groupName)) {
            fallbackIconByGroup.set(icon.groupName, icon.iconId);
        }
    }

    const defaultCategories = getDefaultCategories();
    const categoriesToInsert = defaultCategories.map((category: any) => {
        const categoryIconId = iconByKey.get(category.icon) ?? fallbackIconByGroup.get(category.group);

        if (!categoryIconId) {
            throw new Error(`Missing category icon for ${category.name} (${category.group}).`);
        }

        return {
            userId,
            categoryIconId,
            name: category.name,
            type: category.type,
            color: category.color,
        };
    });

    await db.insert(categories)
        .values(categoriesToInsert)
        .onConflictDoNothing();
}
