import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { profileService } from "./profile.service";
import {
    changePasswordSchema,
    updatePreferencesSchema,
    updateProfileSchema,
} from "./profile.schema";

export class ProfileController {
    async getProfile(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const profile =
            await profileService.getProfile(
                request.user.sub,
            );

        return reply.send({
            success: true,
            message: "Profile fetched successfully.",
            data: profile,
        });
    }

    async updateProfile(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const data = updateProfileSchema.parse(
            request.body,
        );

        const profile =
            await profileService.updateProfile(
                request.user.sub,
                data,
            );

        return reply.send({
            success: true,
            message: "Profile updated successfully.",
            data: profile,
        });
    }

    async updatePreferences(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const data =
            updatePreferencesSchema.parse(
                request.body,
            );

        const profile =
            await profileService.updatePreferences(
                request.user.sub,
                data,
            );

        return reply.send({
            success: true,
            message:
                "Preferences updated successfully.",
            data: profile,
        });
    }

    async changePassword(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const data =
            changePasswordSchema.parse(
                request.body,
            );

        const result =
            await profileService.changePassword(
                request.user.sub,
                data,
            );

        return reply.send({
            success: true,
            message: result.message,
            data: null,
        });
    }
}

export const profileController =
    new ProfileController();