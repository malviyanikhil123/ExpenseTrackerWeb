import type { FastifyInstance } from "fastify";

import { categoriesController } from "./categories.controller";

export async function categoriesRoutes(
    fastify: FastifyInstance,
) {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.post(
        "/",
        categoriesController.create.bind(categoriesController),
    );

    fastify.get(
        "/",
        categoriesController.findAll.bind(categoriesController),
    );

    fastify.get(
        "/:id",
        categoriesController.findById.bind(categoriesController),
    );

    fastify.patch(
        "/:id",
        categoriesController.update.bind(categoriesController),
    );

    fastify.delete(
        "/:id",
        categoriesController.delete.bind(categoriesController),
    );
}