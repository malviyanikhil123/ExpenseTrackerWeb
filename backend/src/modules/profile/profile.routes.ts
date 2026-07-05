import type { FastifyInstance } from "fastify";

import { profileController } from "./profile.controller";

export async function profileRoutes(
    fastify: FastifyInstance,
) {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.get(
        "/",
        profileController.getProfile.bind(
            profileController,
        ),
    );

    fastify.patch(
        "/",
        profileController.updateProfile.bind(
            profileController,
        ),
    );

    fastify.patch(
        "/preferences",
        profileController.updatePreferences.bind(
            profileController,
        ),
    );

    fastify.patch(
        "/password",
        profileController.changePassword.bind(
            profileController,
        ),
    );
}