import { db } from "../index";

import seedCategoryGroups from "./category-groups.seed";
import seedCategoryIcons from "./category-icons.seed";
import { defaultCategoriesSeed } from "./default-categories.seed";

import { categoryGroups } from "../schema/categoryGroups";
import { categoryIcons } from "../schema/categoryIcons";
import { categories } from "../schema/categories";

async function seed() {
    console.log("🌱 Starting database seeding...");

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

    console.log("🎉 Database seeding completed.");

    process.exit(0);
}

seed().catch((error) => {
    console.error(error);
    process.exit(1);
});