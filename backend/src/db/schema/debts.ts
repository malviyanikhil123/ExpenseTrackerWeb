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
import { debtTypeEnum, loanStatusEnum } from "./enums";

export const debts = pgTable(
    "debts",
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

        type: debtTypeEnum()
            .notNull(),

        partyName: text("party_name")
            .notNull(),

        partyPhone: text("party_phone"),

        phoneNumber: text("phone_number"),

        totalAmount: numeric("total_amount", {
            precision: 12,
            scale: 2,
        }).notNull(),

        debtDate: timestamp("debt_date", {
            mode: "date",
        }).notNull(),

        dueDate: timestamp("due_date", {
            mode: "date",
        }),

        note: text("note"),

        status: loanStatusEnum()
            .default("PENDING")
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
        index("debts_user_id_idx").on(table.userId),

        index("debts_account_id_idx").on(table.accountId),

        index("debts_type_idx").on(table.type),

        index("debts_status_idx").on(table.status),

        index("debts_date_idx").on(table.debtDate),

        index("debts_deleted_at_idx").on(table.deletedAt),
    ]
);

export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;