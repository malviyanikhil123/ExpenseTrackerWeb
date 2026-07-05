import type { FastifyReply, FastifyRequest } from "fastify";

import { createAuthService } from "./auth.service";
import {
    changePasswordSchema,
    loginSchema,
    refreshTokenSchema,
    registerSchema,
} from "./auth.schema";

export class AuthController {
    async register(request: FastifyRequest, reply: FastifyReply) {
        const data = registerSchema.parse(request.body);

        const authService = createAuthService(request.server);

        const result = await authService.register(data);

        return reply.code(201).send(result);
    }

    async login(request: FastifyRequest, reply: FastifyReply) {
        const data = loginSchema.parse(request.body);

        const authService = createAuthService(request.server);

        const result = await authService.login(data);

        return reply.send(result);
    }

    async refresh(request: FastifyRequest, reply: FastifyReply) {
        const data = refreshTokenSchema.parse(request.body);

        const authService = createAuthService(request.server);

        const result = await authService.refresh(data.refreshToken);

        return reply.send(result);
    }

    async logout(request: FastifyRequest, reply: FastifyReply) {
        const authService = createAuthService(request.server);

        const result = await authService.logout();

        return reply.send(result);
    }

    async changePassword(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const data = changePasswordSchema.parse(request.body);

        const authService = createAuthService(request.server);

        const user = request.user as { sub: string };

        const result = await authService.changePassword(
            user.sub,
            data,
        );

        return reply.send(result);
    }
}

export const authController = new AuthController();