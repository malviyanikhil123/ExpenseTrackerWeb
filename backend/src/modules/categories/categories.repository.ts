import { and, asc, eq, isNull, ne } from "drizzle-orm";

import { db } from "../../db";
import { categories } from "../../db/schema/categories";
import { categoryIcons } from "../../db/schema/categoryIcons";

import type {
    CategoryType,
    CreateCategoryInput,
    UpdateCategoryInput,
} from "./categories.schema";

export class CategoriesRepository {
    async findIconById(iconId: string) {
        const [icon] = await db
            .select()
            .from(categoryIcons)
            .where(eq(categoryIcons.id, iconId))
            .limit(1);

        return icon ?? null;
    }

    async create(userId: string, data: CreateCategoryInput) {
        const [category] = await db
            .insert(categories)
            .values({
                userId,
                categoryIconId: data.categoryIconId,
                name: data.name,
                type: data.type,
                color: data.color,
            })
            .returning();

        return category;
    }

    async findById(userId: string, categoryId: string) {
        const [category] = await db
            .select()
            .from(categories)
            .where(
                and(
                    eq(categories.id, categoryId),
                    eq(categories.userId, userId),
                    isNull(categories.deletedAt),
                ),
            )
            .limit(1);

        return category ?? null;
    }

    async findAll(userId: string, type?: CategoryType) {
        return db
            .select()
            .from(categories)
            .where(
                and(
                    eq(categories.userId, userId),
                    isNull(categories.deletedAt),
                    type ? eq(categories.type, type) : undefined,
                ),
            )
            .orderBy(asc(categories.name));
    }

    async findByName(
        userId: string,
        name: string,
        type: CategoryType,
    ) {
        const [category] = await db
            .select()
            .from(categories)
            .where(
                and(
                    eq(categories.userId, userId),
                    eq(categories.name, name),
                    eq(categories.type, type),
                    isNull(categories.deletedAt),
                ),
            )
            .limit(1);

        return category ?? null;
    }

    async findDuplicate(
        userId: string,
        categoryId: string,
        name: string,
        type: CategoryType,
    ) {
        const [category] = await db
            .select()
            .from(categories)
            .where(
                and(
                    ne(categories.id, categoryId),
                    eq(categories.userId, userId),
                    eq(categories.name, name),
                    eq(categories.type, type),
                    isNull(categories.deletedAt),
                ),
            )
            .limit(1);

        return category ?? null;
    }

    async update(
        userId: string,
        categoryId: string,
        data: UpdateCategoryInput,
    ) {
        const [category] = await db
            .update(categories)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(categories.id, categoryId),
                    eq(categories.userId, userId),
                    isNull(categories.deletedAt),
                ),
            )
            .returning();

        return category ?? null;
    }

    async softDelete(userId: string, categoryId: string) {
        const [category] = await db
            .update(categories)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(categories.id, categoryId),
                    eq(categories.userId, userId),
                    isNull(categories.deletedAt),
                ),
            )
            .returning();

        return category ?? null;
    }
}

export const categoriesRepository = new CategoriesRepository();