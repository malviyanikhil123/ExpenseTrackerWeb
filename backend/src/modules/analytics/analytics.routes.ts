import type { FastifyInstance } from "fastify";

import { analyticsController } from "./analytics.controller";

export async function analyticsRoutes(
    fastify: FastifyInstance,
) {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.get(
        "/",
        analyticsController.getAnalytics.bind(
            analyticsController,
        ),
    );
}