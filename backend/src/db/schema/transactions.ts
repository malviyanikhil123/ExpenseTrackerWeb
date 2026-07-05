import {
    index,
    numeric,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";
import { accounts } from "./accounts";
import { categories } from "./categories";
import { transactionTypeEnum } from "./enums";

export const transactions = pgTable(
    "transactions",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),

        accountId: uuid("account_id")
            .notNull()
            .references(() => accounts.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),

        categoryId: uuid("category_id")
            .notNull()
            .references(() => categories.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),

        type: transactionTypeEnum().notNull(),

        amount: numeric("amount", {
            precision: 12,
            scale: 2,
        }).notNull(),

        transactionDate: timestamp("transaction_date", {
            mode: "date",
        }).notNull(),

        note: text("note"),

        attachmentUrl: text("attachment_url"),

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
        index("transactions_user_id_idx").on(table.userId),

        index("transactions_account_id_idx").on(table.accountId),

        index("transactions_category_id_idx").on(table.categoryId),

        index("transactions_type_idx").on(table.type),

        index("transactions_date_idx").on(table.transactionDate),

        index("transactions_deleted_at_idx").on(table.deletedAt),
    ]
);