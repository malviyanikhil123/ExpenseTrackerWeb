import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { transactionsService } from "./transactions.service";
import {
    createTransactionSchema,
    transactionParamsSchema,
    transactionQuerySchema,
    updateTransactionSchema,
} from "./transactions.schema";

export class TransactionsController {
    async create(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const data = createTransactionSchema.parse(request.body);

        const transaction =
            await transactionsService.create(
                request.user.sub,
                data,
            );

        return reply.code(201).send({
            success: true,
            message: "Transaction created successfully.",
            data: transaction,
        });
    }

    async findAll(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const query = transactionQuerySchema.parse(
            request.query,
        );

        const transactions =
            await transactionsService.findAll(
                request.user.sub,
                query,
            );

        return reply.send({
            success: true,
            message: "Transactions fetched successfully.",
            data: transactions,
        });
    }

    async findById(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = transactionParamsSchema.parse(
            request.params,
        );

        const transaction =
            await transactionsService.findById(
                request.user.sub,
                id,
            );

        return reply.send({
            success: true,
            message: "Transaction fetched successfully.",
            data: transaction,
        });
    }

    async update(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = transactionParamsSchema.parse(
            request.params,
        );

        const data = updateTransactionSchema.parse(
            request.body,
        );

        const transaction =
            await transactionsService.update(
                request.user.sub,
                id,
                data,
            );

        return reply.send({
            success: true,
            message: "Transaction updated successfully.",
            data: transaction,
        });
    }

    async delete(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = transactionParamsSchema.parse(
            request.params,
        );

        await transactionsService.delete(
            request.user.sub,
            id,
        );

        return reply.send({
            success: true,
            message: "Transaction deleted successfully.",
            data: null,
        });
    }
}

export const transactionsController =
    new TransactionsController();