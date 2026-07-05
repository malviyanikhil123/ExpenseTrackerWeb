import {
    pgTable,
    timestamp,
    uuid,
    index,
    uniqueIndex,
    text,
} from "drizzle-orm/pg-core";

import { users } from "./users";
import { themeEnum } from "./enums";

export const userSettings = pgTable(
    "user_settings",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),

        currency: text("currency")
            .default("INR")
            .notNull(),

        theme: themeEnum()
            .default("SYSTEM")
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
    },
    (table) => [
        uniqueIndex("user_settings_user_id_unique").on(table.userId),

        index("user_settings_currency_idx").on(table.currency),
    ]
);

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;