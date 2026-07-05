import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";
import { categoryIcons } from "./categoryIcons";
import { categoryTypeEnum } from "./enums";

export const categories = pgTable(
    "categories",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),

        categoryIconId: uuid("category_icon_id")
            .notNull()
            .references(() => categoryIcons.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),

        name: text("name").notNull(),

        type: categoryTypeEnum().notNull(),

        color: text("color"),

        isArchived: boolean("is_archived")
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
        index("categories_user_id_idx").on(table.userId),

        index("categories_icon_id_idx").on(table.categoryIconId),

        index("categories_type_idx").on(table.type),

        index("categories_archived_idx").on(table.isArchived),

        uniqueIndex("categories_user_name_type_unique").on(
            table.userId,
            table.name,
            table.type
        ),
    ]
);