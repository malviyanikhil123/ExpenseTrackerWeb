import type { FastifyInstance } from "fastify";

import { transactionsController } from "./transactions.controller";

export async function transactionsRoutes(
    fastify: FastifyInstance,
) {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.post(
        "/",
        transactionsController.create.bind(
            transactionsController,
        ),
    );

    fastify.get(
        "/",
        transactionsController.findAll.bind(
            transactionsController,
        ),
    );

    fastify.get(
        "/:id",
        transactionsController.findById.bind(
            transactionsController,
        ),
    );

    fastify.patch(
        "/:id",
        transactionsController.update.bind(
            transactionsController,
        ),
    );

    fastify.delete(
        "/:id",
        transactionsController.delete.bind(
            transactionsController,
        ),
    );
}