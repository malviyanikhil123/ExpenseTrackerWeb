import { ApiError } from "../../lib/api-response";
import { categoriesRepository } from "./categories.repository";
import type {
    CategoryQueryInput,
    CreateCategoryInput,
    UpdateCategoryInput,
} from "./categories.schema";

export class CategoriesService {
    async create(userId: string, data: CreateCategoryInput) {
        const existingCategory = await categoriesRepository.findByName(
            userId,
            data.name,
            data.type,
        );

        if (existingCategory) {
            throw new ApiError(409, "Category already exists.");
        }

        const icon = await categoriesRepository.findIconById(data.categoryIconId);
        if (!icon) {
            throw new ApiError(404, "Category icon not found.");
        }

        return categoriesRepository.create(userId, data);
    }

    async findAll(userId: string, query: CategoryQueryInput) {
        return categoriesRepository.findAll(userId, query.type);
    }

    async findById(userId: string, categoryId: string) {
        const category = await categoriesRepository.findById(
            userId,
            categoryId,
        );

        if (!category) {
            throw new ApiError(404, "Category not found.");
        }

        return category;
    }

    async update(
        userId: string,
        categoryId: string,
        data: UpdateCategoryInput,
    ) {
        const category = await this.findById(userId, categoryId);

        const name = data.name ?? category.name;
        const type = data.type ?? category.type;

        const duplicate = await categoriesRepository.findDuplicate(
            userId,
            category.id,
            name,
            type,
        );

        if (duplicate) {
            throw new ApiError(409, "Category already exists.");
        }

        if (data.categoryIconId) {
            const icon = await categoriesRepository.findIconById(data.categoryIconId);
            if (!icon) {
                throw new ApiError(404, "Category icon not found.");
            }
        }

        return categoriesRepository.update(
            userId,
            categoryId,
            data,
        );
    }

    async delete(userId: string, categoryId: string) {
        await this.findById(userId, categoryId);

        /**
         * Business Rule:
         * After Income and Expense modules are implemented,
         * verify that this category is not referenced by any
         * transaction before allowing deletion.
         */

        return categoriesRepository.softDelete(
            userId,
            categoryId,
        );
    }
}

export const categoriesService = new CategoriesService();