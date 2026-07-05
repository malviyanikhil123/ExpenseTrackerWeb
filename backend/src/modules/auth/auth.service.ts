import { FastifyInstance } from "fastify";
import { ApiError } from "../../lib/api-response";
import { authRepository } from "./auth.repository";
import {
    ChangePasswordInput,
    LoginInput,
    RegisterInput,
} from "./auth.schema";
import { hashPassword, verifyPassword } from "../../lib/password";
import { seedDefaultCategoriesForUser } from "../../db/seeds/categories-seeder";



export class AuthService {
    constructor(private readonly fastify: FastifyInstance) { }

    async register(data: RegisterInput) {
        const existingUser = await authRepository.findByEmail(data.email);

        if (existingUser) {
            throw new ApiError(409, "Email already exists");
        }

        const hashedPassword = await hashPassword(data.password);

        const user = await authRepository.create({
            ...data,
            password: hashedPassword,
        });

        // Seed default categories for the newly registered user
        await seedDefaultCategoriesForUser(user.id);

        const accessToken = await this.fastify.jwt.sign({
            sub: user.id,
            email: user.email,
        });

        const refreshToken = await this.fastify.jwt.sign(
            {
                sub: user.id,
                email: user.email,
            },
            {
                expiresIn: "30d",
            },
        );

        return {
            user: {
                id: user.id,
                name: user.fullName,
                email: user.email,
            },
            accessToken,
            refreshToken,
        };
    }

    async login(data: LoginInput) {
        const user = await authRepository.findByEmail(data.email);

        if (!user) {
            throw new ApiError(401, "Invalid email or password");
        }

        const isPasswordValid = await verifyPassword(
            data.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid email or password");
        }

        const accessToken = await this.fastify.jwt.sign({
            sub: user.id,
            email: user.email,
        });

        const refreshToken = await this.fastify.jwt.sign(
            {
                sub: user.id,
                email: user.email,
            },
            {
                expiresIn: "30d",
            },
        );

        return {
            user: {
                id: user.id,
                name: user.fullName,
                email: user.email,
            },
            accessToken,
            refreshToken,
        };
    }

    async refresh(refreshToken: string) {
        const payload = await this.fastify.jwt.verify<{
            sub: string;
            email: string;
        }>(refreshToken);

        const user = await authRepository.findById(payload.sub);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const accessToken = await this.fastify.jwt.sign({
            sub: user.id,
            email: user.email,
        });

        const newRefreshToken = await this.fastify.jwt.sign(
            {
                sub: user.id,
                email: user.email,
            },
            {
                expiresIn: "30d",
            },
        );

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }

    async logout() {
        return {
            message: "Logged out successfully",
        };
    }

    async changePassword(userId: string, data: ChangePasswordInput) {
        const user = await authRepository.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const isPasswordValid = await verifyPassword(
            data.currentPassword,
            user.password,
        );

        if (!isPasswordValid) {
            throw new ApiError(400, "Current password is incorrect");
        }

        const hashedPassword = await hashPassword(data.newPassword);

        await authRepository.updatePassword(user.id, hashedPassword);

        return {
            message: "Password changed successfully",
        };
    }
}

export const createAuthService = (fastify: FastifyInstance) =>
    new AuthService(fastify);