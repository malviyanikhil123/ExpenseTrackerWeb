import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { paymentMethodsService } from "./payment-methods.service";

export class PaymentMethodsController {
    async findAll(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const methods = await paymentMethodsService.findAll();

        return reply.send({
            success: true,
            message: "Payment methods fetched successfully.",
            data: methods,
        });
    }
}

export const paymentMethodsController = new PaymentMethodsController();
