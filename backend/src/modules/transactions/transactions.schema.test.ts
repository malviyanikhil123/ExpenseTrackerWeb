import { describe, it, expect } from "vitest";
import {
    createTransactionSchema,
    updateTransactionSchema,
    transactionParamsSchema,
    transactionQuerySchema,
} from "./transactions.schema";

describe("createTransactionSchema", () => {
    it("should validate a correct create transaction payload", () => {
        const data = {
            accountId: "550e8400-e29b-41d4-a716-446655440000",
            paymentMethodId: "770e8400-e29b-41d4-a716-446655440000",
            categoryId: "660e8400-e29b-41d4-a716-446655440000",
            type: "EXPENSE" as const,
            amount: 50.5,
            transactionDate: "2025-01-15",
        };
        const result = createTransactionSchema.parse(data);
        expect(result.type).toBe("EXPENSE");
        expect(result.amount).toBe(50.5);
        expect(result.transactionDate).toBeInstanceOf(Date);
    });

    it("should accept optional fields", () => {
        const data = {
            accountId: "550e8400-e29b-41d4-a716-446655440000",
            paymentMethodId: "770e8400-e29b-41d4-a716-446655440000",
            categoryId: "660e8400-e29b-41d4-a716-446655440000",
            type: "INCOME" as const,
            amount: 1000,
            transactionDate: "2025-01-15",
            note: "Monthly salary",
            attachmentUrl: "https://example.com/receipt.jpg",
        };
        const result = createTransactionSchema.parse(data);
        expect(result.note).toBe("Monthly salary");
        expect(result.attachmentUrl).toBe("https://example.com/receipt.jpg");
    });

    it("should reject zero amount", () => {
        expect(() =>
            createTransactionSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                paymentMethodId: "770e8400-e29b-41d4-a716-446655440000",
                categoryId: "660e8400-e29b-41d4-a716-446655440000",
                type: "EXPENSE",
                amount: 0,
                transactionDate: "2025-01-15",
            })
        ).toThrow();
    });

    it("should reject negative amount", () => {
        expect(() =>
            createTransactionSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                paymentMethodId: "770e8400-e29b-41d4-a716-446655440000",
                categoryId: "660e8400-e29b-41d4-a716-446655440000",
                type: "EXPENSE",
                amount: -10,
                transactionDate: "2025-01-15",
            })
        ).toThrow();
    });

    it("should reject invalid account UUID", () => {
        expect(() =>
            createTransactionSchema.parse({
                accountId: "not-uuid",
                paymentMethodId: "770e8400-e29b-41d4-a716-446655440000",
                categoryId: "660e8400-e29b-41d4-a716-446655440000",
                type: "EXPENSE",
                amount: 50,
                transactionDate: "2025-01-15",
            })
        ).toThrow();
    });

    it("should reject invalid type", () => {
        expect(() =>
            createTransactionSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                paymentMethodId: "770e8400-e29b-41d4-a716-446655440000",
                categoryId: "660e8400-e29b-41d4-a716-446655440000",
                type: "INVALID",
                amount: 50,
                transactionDate: "2025-01-15",
            })
        ).toThrow();
    });

    it("should reject note exceeding max length", () => {
        expect(() =>
            createTransactionSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                paymentMethodId: "770e8400-e29b-41d4-a716-446655440000",
                categoryId: "660e8400-e29b-41d4-a716-446655440000",
                type: "EXPENSE",
                amount: 50,
                transactionDate: "2025-01-15",
                note: "A".repeat(501),
            })
        ).toThrow();
    });

    it("should reject invalid attachment URL", () => {
        expect(() =>
            createTransactionSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                paymentMethodId: "770e8400-e29b-41d4-a716-446655440000",
                categoryId: "660e8400-e29b-41d4-a716-446655440000",
                type: "EXPENSE",
                amount: 50,
                transactionDate: "2025-01-15",
                attachmentUrl: "not-a-url",
            })
        ).toThrow();
    });
});

describe("updateTransactionSchema", () => {
    it("should allow partial updates", () => {
        const result = updateTransactionSchema.parse({ amount: 75 });
        expect(result.amount).toBe(75);
        expect(result.type).toBeUndefined();
    });

    it("should allow empty object", () => {
        const result = updateTransactionSchema.parse({});
        expect(result).toEqual({});
    });
});

describe("transactionParamsSchema", () => {
    it("should accept a valid UUID", () => {
        const result = transactionParamsSchema.parse({
            id: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject an invalid UUID", () => {
        expect(() =>
            transactionParamsSchema.parse({ id: "invalid" })
        ).toThrow();
    });
});

describe("transactionQuerySchema", () => {
    it("should accept valid query filters", () => {
        const result = transactionQuerySchema.parse({
            type: "INCOME",
            accountId: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.type).toBe("INCOME");
    });

    it("should accept empty query", () => {
        const result = transactionQuerySchema.parse({});
        expect(Object.keys(result).filter(k => (result as any)[k] !== undefined)).toHaveLength(0);
    });

    it("should coerce date strings for startDate and endDate", () => {
        const result = transactionQuerySchema.parse({
            startDate: "2025-01-01",
            endDate: "2025-12-31",
        });
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
    });
});
