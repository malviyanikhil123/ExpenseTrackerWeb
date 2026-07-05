import type { FastifyInstance } from "fastify";

import { repaymentsController } from "./repayments.controller";

export async function repaymentsRoutes(
    fastify: FastifyInstance,
) {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.post(
        "/",
        repaymentsController.create.bind(
            repaymentsController,
        ),
    );

    fastify.get(
        "/",
        repaymentsController.findAll.bind(
            repaymentsController,
        ),
    );

    fastify.get(
        "/:id",
        repaymentsController.findById.bind(
            repaymentsController,
        ),
    );

    fastify.patch(
        "/:id",
        repaymentsController.update.bind(
            repaymentsController,
        ),
    );

    fastify.delete(
        "/:id",
        repaymentsController.delete.bind(
            repaymentsController,
        ),
    );
}