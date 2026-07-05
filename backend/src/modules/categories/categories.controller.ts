import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { categoriesService } from "./categories.service";
import {
    categoryParamsSchema,
    categoryQuerySchema,
    createCategorySchema,
    updateCategorySchema,
} from "./categories.schema";

export class CategoriesController {
    async create(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const data = createCategorySchema.parse(request.body);

        const category = await categoriesService.create(
            request.user.sub,
            data,
        );

        return reply.code(201).send({
            success: true,
            message: "Category created successfully.",
            data: category,
        });
    }

    async findAll(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const query = categoryQuerySchema.parse(request.query);

        const categories = await categoriesService.findAll(
            request.user.sub,
            query,
        );

        return reply.send({
            success: true,
            message: "Categories fetched successfully.",
            data: categories,
        });
    }

    async findById(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = categoryParamsSchema.parse(request.params);

        const category = await categoriesService.findById(
            request.user.sub,
            id,
        );

        return reply.send({
            success: true,
            message: "Category fetched successfully.",
            data: category,
        });
    }

    async update(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = categoryParamsSchema.parse(request.params);

        const data = updateCategorySchema.parse(request.body);

        const category = await categoriesService.update(
            request.user.sub,
            id,
            data,
        );

        return reply.send({
            success: true,
            message: "Category updated successfully.",
            data: category,
        });
    }

    async delete(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = categoryParamsSchema.parse(request.params);

        await categoriesService.delete(
            request.user.sub,
            id,
        );

        return reply.send({
            success: true,
            message: "Category deleted successfully.",
            data: null,
        });
    }
}

export const categoriesController = new CategoriesController();