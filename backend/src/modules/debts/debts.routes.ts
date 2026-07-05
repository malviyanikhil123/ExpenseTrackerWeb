import type { FastifyInstance } from "fastify";

import { debtsController } from "./debts.controller";

export async function debtsRoutes(
    fastify: FastifyInstance,
) {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.post(
        "/",
        debtsController.create.bind(debtsController),
    );

    fastify.get(
        "/",
        debtsController.findAll.bind(debtsController),
    );

    fastify.get(
        "/:id",
        debtsController.findById.bind(debtsController),
    );

    fastify.patch(
        "/:id",
        debtsController.update.bind(debtsController),
    );

    fastify.delete(
        "/:id",
        debtsController.delete.bind(debtsController),
    );
}