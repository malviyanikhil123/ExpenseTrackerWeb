import { describe, it, expect } from "vitest";
import {
    createRepaymentSchema,
    updateRepaymentSchema,
    repaymentParamsSchema,
    repaymentQuerySchema,
} from "./repayments.schema";

describe("createRepaymentSchema", () => {
    it("should validate a correct repayment payload", () => {
        const data = {
            debtId: "550e8400-e29b-41d4-a716-446655440000",
            amount: 100,
            repaymentDate: "2025-03-15",
        };
        const result = createRepaymentSchema.parse(data);
        expect(result.debtId).toBe("550e8400-e29b-41d4-a716-446655440000");
        expect(result.amount).toBe(100);
        expect(result.repaymentDate).toBeInstanceOf(Date);
    });

    it("should accept optional note", () => {
        const data = {
            debtId: "550e8400-e29b-41d4-a716-446655440000",
            amount: 200,
            repaymentDate: "2025-03-15",
            note: "Partial repayment",
        };
        const result = createRepaymentSchema.parse(data);
        expect(result.note).toBe("Partial repayment");
    });

    it("should reject zero amount", () => {
        expect(() =>
            createRepaymentSchema.parse({
                debtId: "550e8400-e29b-41d4-a716-446655440000",
                amount: 0,
                repaymentDate: "2025-03-15",
            })
        ).toThrow();
    });

    it("should reject negative amount", () => {
        expect(() =>
            createRepaymentSchema.parse({
                debtId: "550e8400-e29b-41d4-a716-446655440000",
                amount: -50,
                repaymentDate: "2025-03-15",
            })
        ).toThrow();
    });

    it("should reject invalid debt UUID", () => {
        expect(() =>
            createRepaymentSchema.parse({
                debtId: "not-a-uuid",
                amount: 100,
                repaymentDate: "2025-03-15",
            })
        ).toThrow();
    });

    it("should reject note exceeding 500 characters", () => {
        expect(() =>
            createRepaymentSchema.parse({
                debtId: "550e8400-e29b-41d4-a716-446655440000",
                amount: 100,
                repaymentDate: "2025-03-15",
                note: "N".repeat(501),
            })
        ).toThrow();
    });
});

describe("updateRepaymentSchema", () => {
    it("should allow partial updates", () => {
        const result = updateRepaymentSchema.parse({ amount: 150 });
        expect(result.amount).toBe(150);
    });

    it("should allow empty object", () => {
        const result = updateRepaymentSchema.parse({});
        expect(result).toEqual({});
    });
});

describe("repaymentParamsSchema", () => {
    it("should accept valid UUID", () => {
        const result = repaymentParamsSchema.parse({
            id: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject invalid UUID", () => {
        expect(() =>
            repaymentParamsSchema.parse({ id: "invalid" })
        ).toThrow();
    });
});

describe("repaymentQuerySchema", () => {
    it("should accept valid debtId filter", () => {
        const result = repaymentQuerySchema.parse({
            debtId: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.debtId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should accept date range filters", () => {
        const result = repaymentQuerySchema.parse({
            startDate: "2025-01-01",
            endDate: "2025-12-31",
        });
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
    });

    it("should accept empty query", () => {
        const result = repaymentQuerySchema.parse({});
        expect(result.debtId).toBeUndefined();
    });
});
