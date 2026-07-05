import type { FastifyInstance } from "fastify";

import { dashboardController } from "./dashboard.controller";

export async function dashboardRoutes(
    fastify: FastifyInstance,
) {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.get(
        "/",
        dashboardController.getDashboard.bind(
            dashboardController,
        ),
    );
}