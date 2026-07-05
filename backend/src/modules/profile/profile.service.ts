import bcrypt from "bcryptjs";

import { ApiError } from "../../lib/api-response";

import { profileRepository } from "./profile.repository";
import type {
    ChangePasswordInput,
    UpdatePreferencesInput,
    UpdateProfileInput,
} from "./profile.schema";

export class ProfileService {
    async getProfile(userId: string) {
        const profile =
            await profileRepository.findByUserId(
                userId,
            );

        if (!profile) {
            throw new ApiError(404, "Profile not found.");
        }

        return profile;
    }

    async updateProfile(
        userId: string,
        data: UpdateProfileInput,
    ) {
        await this.getProfile(userId);

        await profileRepository.updateProfile(
            userId,
            data,
        );

        return this.getProfile(userId);
    }

    async updatePreferences(
        userId: string,
        data: UpdatePreferencesInput,
    ) {
        await this.getProfile(userId);

        await profileRepository.updatePreferences(
            userId,
            data,
        );

        return this.getProfile(userId);
    }

    async changePassword(
        userId: string,
        data: ChangePasswordInput,
    ) {
        const user =
            await profileRepository.findUserWithPassword(
                userId,
            );

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        const isPasswordValid =
            await bcrypt.compare(
                data.currentPassword,
                user.password,
            );

        if (!isPasswordValid) {
            throw new ApiError(
                400,
                "Current password is incorrect.",
            );
        }

        const hashedPassword =
            await bcrypt.hash(
                data.newPassword,
                12,
            );

        await profileRepository.updatePassword(
            userId,
            hashedPassword,
        );

        return {
            message:
                "Password changed successfully.",
        };
    }
}

export const profileService =
    new ProfileService();