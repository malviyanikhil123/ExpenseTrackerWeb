import { and, eq, isNull } from "drizzle-orm";

import { db } from "../../db";
import { userSettings } from "../../db/schema/userSettings";
import { users } from "../../db/schema/users";

import type {
    ChangePasswordInput,
    UpdatePreferencesInput,
    UpdateProfileInput,
} from "./profile.schema";

export class ProfileRepository {
    async findByUserId(userId: string) {
        const [profile] = await db
            .select({
                id: users.id,
                fullName: users.fullName,
                email: users.email,
                avatarUrl: users.avatar,
                currency: userSettings.currency,
                theme: userSettings.theme,
                createdAt: users.createdAt,
            })
            .from(users)
            .leftJoin(
                userSettings,
                eq(userSettings.userId, users.id),
            )
            .where(
                and(
                    eq(users.id, userId),
                    isNull(users.deletedAt),
                ),
            )
            .limit(1);

        return profile ?? null;
    }

    async updateProfile(
        userId: string,
        data: UpdateProfileInput,
    ) {
        const [user] = await db
            .update(users)
            .set({
                ...(data.fullName !== undefined && {
                    fullName: data.fullName,
                }),

                ...(data.avatarUrl !== undefined && {
                    avatar: data.avatarUrl,
                }),

                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

        return user;
    }

    async updatePreferences(
        userId: string,
        data: UpdatePreferencesInput,
    ) {
        const [settings] = await db
            .update(userSettings)
            .set({
                currency: data.currency,
                theme: data.theme,
                updatedAt: new Date(),
            })
            .where(eq(userSettings.userId, userId))
            .returning();

        return settings;
    }

    async findUserWithPassword(
        userId: string,
    ) {
        const [user] = await db
            .select({
                id: users.id,
                password: users.password,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        return user ?? null;
    }

    async updatePassword(
        userId: string,
        hashedPassword: string,
    ) {
        const [user] = await db
            .update(users)
            .set({
                password: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
            });

        return user;
    }
}

export const profileRepository =
    new ProfileRepository();