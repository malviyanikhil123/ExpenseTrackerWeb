import {
    boolean,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

export const paymentMethods = pgTable(
    "payment_methods",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        name: text("name").notNull(),

        code: text("code").notNull().unique(),

        icon: text("icon"),

        isActive: boolean("is_active")
            .default(true)
            .notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .defaultNow()
            .notNull(),
    }
);

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;
