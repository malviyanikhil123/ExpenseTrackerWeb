import {
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

import { categoryTypeEnum } from "./enums";

export const categoryGroups = pgTable(
    "category_groups",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        name: text("name").notNull(),

        type: categoryTypeEnum().notNull(),

        sortOrder: integer("sort_order")
            .default(0)
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
        uniqueIndex("category_groups_name_type_unique").on(
            table.name,
            table.type
        ),

        index("category_groups_type_idx").on(table.type),

        index("category_groups_sort_order_idx").on(table.sortOrder),
    ]
);