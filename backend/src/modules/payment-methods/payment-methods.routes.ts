import type { FastifyInstance } from "fastify";

import { paymentMethodsController } from "./payment-methods.controller";

export async function paymentMethodsRoutes(
    fastify: FastifyInstance,
) {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.get(
        "/",
        paymentMethodsController.findAll.bind(
            paymentMethodsController,
        ),
    );
}
