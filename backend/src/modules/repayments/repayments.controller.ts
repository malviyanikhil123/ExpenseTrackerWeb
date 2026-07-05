import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { repaymentsService } from "./repayments.service";
import {
    createRepaymentSchema,
    repaymentParamsSchema,
    repaymentQuerySchema,
    updateRepaymentSchema,
} from "./repayments.schema";

export class RepaymentsController {
    async create(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const data = createRepaymentSchema.parse(
            request.body,
        );

        const repayment =
            await repaymentsService.create(
                data,
                request.user.sub,
            );

        return reply.code(201).send({
            success: true,
            message: "Repayment created successfully.",
            data: repayment,
        });
    }

    async findAll(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { debtId } =
            repaymentQuerySchema.parse(request.query);

        const repayments =
            await repaymentsService.findByDebtId(
                request.user.sub,
                debtId!,
            );

        return reply.send({
            success: true,
            message: "Repayments fetched successfully.",
            data: repayments,
        });
    }

    async findById(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } =
            repaymentParamsSchema.parse(
                request.params,
            );

        const repayment =
            await repaymentsService.findById(
                request.user.sub,
                id,
            );

        return reply.send({
            success: true,
            message: "Repayment fetched successfully.",
            data: repayment,
        });
    }

    async update(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } =
            repaymentParamsSchema.parse(
                request.params,
            );

        const data =
            updateRepaymentSchema.parse(
                request.body,
            );

        const repayment =
            await repaymentsService.update(
                request.user.sub,
                id,
                data,
            );

        return reply.send({
            success: true,
            message: "Repayment updated successfully.",
            data: repayment,
        });
    }

    async delete(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } =
            repaymentParamsSchema.parse(
                request.params,
            );

        await repaymentsService.delete(
            request.user.sub,
            id,
        );

        return reply.send({
            success: true,
            message: "Repayment deleted successfully.",
            data: null,
        });
    }
}

export const repaymentsController =
    new RepaymentsController();