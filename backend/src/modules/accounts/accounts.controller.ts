import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { accountsService } from "./accounts.service";
import {
    accountParamsSchema,
    accountQuerySchema,
    createAccountSchema,
    updateAccountSchema,
} from "./accounts.schema";

export class AccountsController {
    async create(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const data = createAccountSchema.parse(request.body);

        const account = await accountsService.create(
            request.user.sub,
            data,
        );

        return reply.code(201).send({
            success: true,
            message: "Account created successfully.",
            data: account,
        });
    }

    async findAll(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const query = accountQuerySchema.parse(request.query);

        const accounts = await accountsService.findAll(
            request.user.sub,
            query,
        );

        return reply.send({
            success: true,
            message: "Accounts fetched successfully.",
            data: accounts,
        });
    }

    async findById(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = accountParamsSchema.parse(request.params);

        const account = await accountsService.findById(
            request.user.sub,
            id,
        );

        return reply.send({
            success: true,
            message: "Account fetched successfully.",
            data: account,
        });
    }

    async update(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = accountParamsSchema.parse(request.params);

        const data = updateAccountSchema.parse(request.body);

        const account = await accountsService.update(
            request.user.sub,
            id,
            data,
        );

        return reply.send({
            success: true,
            message: "Account updated successfully.",
            data: account,
        });
    }

    async delete(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const { id } = accountParamsSchema.parse(request.params);

        await accountsService.delete(
            request.user.sub,
            id,
        );

        return reply.send({
            success: true,
            message: "Account deleted successfully.",
            data: null,
        });
    }
}

export const accountsController = new AccountsController();