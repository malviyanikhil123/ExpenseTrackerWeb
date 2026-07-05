import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

import { categoryGroups } from "./categoryGroups";
import { categoryTypeEnum } from "./enums";

export const categoryIcons = pgTable(
    "category_icons",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        groupId: uuid("group_id")
            .notNull()
            .references(() => categoryGroups.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),

        displayName: text("display_name").notNull(),

        iconKey: text("icon_key").notNull(),

        type: categoryTypeEnum().notNull(),

        sortOrder: integer("sort_order")
            .default(0)
            .notNull(),

        isActive: boolean("is_active")
            .default(true)
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
        uniqueIndex("category_icons_icon_key_unique").on(table.iconKey),

        index("category_icons_group_id_idx").on(table.groupId),

        index("category_icons_type_idx").on(table.type),

        index("category_icons_active_idx").on(table.isActive),

        index("category_icons_sort_order_idx").on(table.sortOrder),
    ]
);