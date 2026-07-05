import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

import { providerEnum } from "./enums";

export const users = pgTable(
    "users",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        fullName: text("full_name").notNull(),

        email: text("email").notNull(),

        password: text("password").notNull(),

        provider: providerEnum().default("LOCAL").notNull(),

        avatar: text("avatar"),

        isActive: boolean("is_active")
            .default(true)
            .notNull(),

        isEmailVerified: boolean("is_email_verified")
            .default(false)
            .notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
            mode: "date",
        })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),

        deletedAt: timestamp("deleted_at", {
            withTimezone: true,
            mode: "date",
        }),
    },
    (table) => [
        uniqueIndex("users_email_unique").on(table.email),
        index("users_email_idx").on(table.email),
        index("users_active_idx").on(table.isActive),
    ]
);