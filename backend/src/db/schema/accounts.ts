import {
    boolean,
    index,
    integer,
    numeric,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

import { accountTypeEnum } from "./enums";
import { users } from "./users";

export const accounts = pgTable(
    "accounts",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),

        name: text("name").notNull(),

        type: accountTypeEnum().notNull(),

        openingBalance: numeric("opening_balance", {
            precision: 12,
            scale: 2,
        })
            .default("0.00")
            .notNull(),

        description: text("description"),

        color: text("color"),

        icon: text("icon"),

        isDefault: boolean("is_default")
            .default(false)
            .notNull(),

        isArchived: boolean("is_archived")
            .default(false)
            .notNull(),

        creditLimit: numeric("credit_limit", {
            precision: 12,
            scale: 2,
        })
            .default("0.00")
            .notNull(),

        statementDate: integer("statement_date"),

        dueDate: integer("due_date"),

        linkedBankAccountId: uuid("linked_bank_account_id")
            .references((): any => accounts.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),

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
        index("accounts_user_id_idx").on(table.userId),
        index("accounts_type_idx").on(table.type),
        index("accounts_archived_idx").on(table.isArchived),
        uniqueIndex("accounts_user_name_unique").on(
            table.userId,
            table.name
        ),
    ]
);

type InsertAccount = typeof accounts.$inferInsert;