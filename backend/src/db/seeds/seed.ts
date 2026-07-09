import { eq } from "drizzle-orm";

import { db } from "../index";

import seedCategoryGroups from "./category-groups.seed";
import seedCategoryIcons from "./category-icons.seed";
import { defaultCategoriesSeed } from "./default-categories.seed";

import { hashPassword } from "../../lib/password";
import { users } from "../schema/users";
import { categoryGroups } from "../schema/categoryGroups";
import { categoryIcons } from "../schema/categoryIcons";
import { categories } from "../schema/categories";
import { paymentMethods } from "../schema/paymentMethods";

const SEED_USER_EMAIL = "seed@expensetracker.local";
const SEED_USER_PASSWORD = "Password123!";

function getDefaultCategories() {
    return Object.entries(defaultCategoriesSeed).flatMap(([type, categoryList]) =>
        categoryList.map((category) => ({
            ...category,
            type: type as "INCOME" | "EXPENSE",
        }))
    );
}

async function seed() {
    console.log("🌱 Starting database seeding...");

    const hashedPassword = await hashPassword(SEED_USER_PASSWORD);

    await db.insert(users)
        .values({
            fullName: "Seed User",
            email: SEED_USER_EMAIL,
            password: hashedPassword,
            provider: "LOCAL",
            isEmailVerified: true,
        })
        .onConflictDoNothing();

    const [seedUser] = await db.select()
        .from(users)
        .where(eq(users.email, SEED_USER_EMAIL))
        .limit(1);

    if (!seedUser) {
        throw new Error("Unable to create or load the seed user.");
    }

    // Seed Payment Methods
    const paymentMethodsData = [
        { name: "Cash", code: "CASH", icon: "Wallet", isActive: true },
        { name: "Google Pay", code: "GOOGLE_PAY", icon: "Smartphone", isActive: true },
        { name: "PhonePe", code: "PHONEPE", icon: "Smartphone", isActive: true },
        { name: "Paytm", code: "PAYTM", icon: "Smartphone", isActive: true },
        { name: "BHIM", code: "BHIM", icon: "Smartphone", isActive: true },
        { name: "Debit Card", code: "DEBIT_CARD", icon: "CreditCard", isActive: true },
        { name: "Credit Card", code: "CREDIT_CARD", icon: "CreditCard", isActive: true },
        { name: "Net Banking", code: "NET_BANKING", icon: "Globe", isActive: true }
    ];

    await db.insert(paymentMethods)
        .values(paymentMethodsData)
        .onConflictDoNothing();

    console.log("✅ Payment Methods Seeded");

    // Seed Category Groups
    const groupsSeedData = await seedCategoryGroups();
    const groupsToInsert = groupsSeedData.map((group: any) => {
        // Determine type based on group name
        const type: "INCOME" | "EXPENSE" = group.name === "Income" ? "INCOME" : "EXPENSE";
        return {
            name: group.name,
            type,
            sortOrder: group.sortOrder || 0,
        };
    });

    await db.insert(categoryGroups)
        .values(groupsToInsert)
        .onConflictDoNothing();

    console.log("✅ Category Groups Seeded");

    // Fetch created groups to get their IDs
    const createdGroups = await db.select().from(categoryGroups);
    const groupMap = new Map(createdGroups.map(g => [g.name, g.id]));

    // Seed Category Icons
    const iconsSeedData = await seedCategoryIcons();
    const iconsToInsert = iconsSeedData.map((icon: any) => {
        const groupId = groupMap.get(icon.group);
        const type: "INCOME" | "EXPENSE" = icon.group === "Income" ? "INCOME" : "EXPENSE";
        return {
            groupId: groupId || "",
            displayName: icon.icon,
            iconKey: icon.icon,
            type,
            sortOrder: icon.sortOrder || 0,
            isActive: true,
        };
    }).filter((icon: any) => icon.groupId);

    await db.insert(categoryIcons)
        .values(iconsToInsert)
        .onConflictDoNothing();

    console.log("✅ Category Icons Seeded");

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
            userId: seedUser.id,
            categoryIconId,
            name: category.name,
            type: category.type,
            color: category.color,
        };
    });

    await db.insert(categories)
        .values(categoriesToInsert)
        .onConflictDoNothing();

    console.log("✅ Default Categories Seeded");

    console.log("🎉 Database seeding completed.");

    process.exit(0);
}

seed().catch((error) => {
    console.error(error);
    process.exit(1);
});