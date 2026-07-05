import {
    index,
    numeric,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { debts } from "./debts";

export const repayments = pgTable(
    "repayments",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        debtId: uuid("debt_id")
            .notNull()
            .references(() => debts.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),

        amount: numeric("amount", {
            precision: 12,
            scale: 2,
        }).notNull(),

        repaymentDate: timestamp("repayment_date", {
            mode: "date",
        }).notNull(),

        note: text("note"),

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
        index("repayments_debt_id_idx").on(table.debtId),

        index("repayments_date_idx").on(table.repaymentDate),
    ]
);

export type Repayment = typeof repayments.$inferSelect;
export type NewRepayment = typeof repayments.$inferInsert;