import type { FastifyInstance } from "fastify";

import { accountsController } from "./accounts.controller";

export async function accountsRoutes(
    fastify: FastifyInstance,
) {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.post(
        "/",
        accountsController.create.bind(accountsController),
    );

    fastify.get(
        "/",
        accountsController.findAll.bind(accountsController),
    );

    fastify.get(
        "/:id",
        accountsController.findById.bind(accountsController),
    );

    fastify.patch(
        "/:id",
        accountsController.update.bind(accountsController),
    );

    fastify.delete(
        "/:id",
        accountsController.delete.bind(accountsController),
    );
}