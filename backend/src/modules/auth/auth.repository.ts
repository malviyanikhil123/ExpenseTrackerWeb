import { and, eq, isNull } from "drizzle-orm";

import { db } from "../../db";
import { users } from "../../db/schema/users";

import type { RegisterInput } from "./auth.schema";

export class AuthRepository {
    async findByEmail(email: string) {
        const [user] = await db
            .select()
            .from(users)
            .where(
                and(
                    eq(users.email, email),
                    isNull(users.deletedAt),
                ),
            )
            .limit(1);

        return user ?? null;
    }

    async findById(id: string) {
        const [user] = await db
            .select()
            .from(users)
            .where(
                and(
                    eq(users.id, id),
                    isNull(users.deletedAt),
                ),
            )
            .limit(1);

        return user ?? null;
    }

    async create(data: RegisterInput & { password: string }) {
        const [user] = await db
            .insert(users)
            .values({
                fullName: data.name,
                email: data.email,
                password: data.password,
            })
            .returning();

        return user;
    }

    async updatePassword(userId: string, password: string) {
        const [user] = await db
            .update(users)
            .set({
                password,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

        return user;
    }
}

export const authRepository = new AuthRepository();