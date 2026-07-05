import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { debtsService } from "./debts.service";
import {
    createDebtSchema,
    debtParamsSchema,
    debtQuerySchema,
    updateDebtSchema,
} from "./debts.schema";

export class DebtsController {
    async create(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const data = createDebtSchema.parse(request.body);

        const debt = await debtsService.create(
            request.user.sub,
            data,
        );

        return reply.code(201).send({
            success: true,
            message: "Debt created successfully.",
            data: debt,
        });
    }

    async findAll(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const query = debtQuerySchema.parse(request.query);

        const debts = await debtsService.findAll(
            request.user.sub,
            query,
        );

        return reply.send({
            success: true,
            message: "Debts fetched successfully.",
            data: debts,
        });
    }

    async findById(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = debtParamsSchema.parse(
            request.params,
        );

        const debt = await debtsService.findById(
            request.user.sub,
            id,
        );

        return reply.send({
            success: true,
            message: "Debt fetched successfully.",
            data: debt,
        });
    }

    async update(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = debtParamsSchema.parse(
            request.params,
        );

        const data = updateDebtSchema.parse(request.body);

        const debt = await debtsService.update(
            request.user.sub,
            id,
            data,
        );

        return reply.send({
            success: true,
            message: "Debt updated successfully.",
            data: debt,
        });
    }

    async delete(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = debtParamsSchema.parse(
            request.params,
        );

        await debtsService.delete(
            request.user.sub,
            id,
        );

        return reply.send({
            success: true,
            message: "Debt deleted successfully.",
            data: null,
        });
    }
}

export const debtsController =
    new DebtsController();