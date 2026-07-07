import { describe, it, expect } from "vitest";
import {
    createDebtSchema,
    updateDebtSchema,
    debtParamsSchema,
    debtQuerySchema,
} from "./debts.schema";

describe("createDebtSchema", () => {
    it("should validate a correct LENT debt payload", () => {
        const data = {
            accountId: "550e8400-e29b-41d4-a716-446655440000",
            type: "LENT" as const,
            partyName: "John Doe",
            totalAmount: 500,
            debtDate: "2025-01-15",
        };
        const result = createDebtSchema.parse(data);
        expect(result.type).toBe("LENT");
        expect(result.partyName).toBe("John Doe");
        expect(result.totalAmount).toBe(500);
        expect(result.debtDate).toBeInstanceOf(Date);
    });

    it("should validate a BORROW debt", () => {
        const data = {
            accountId: "550e8400-e29b-41d4-a716-446655440000",
            type: "BORROW" as const,
            partyName: "Jane Smith",
            totalAmount: 1000,
            debtDate: "2025-02-20",
        };
        const result = createDebtSchema.parse(data);
        expect(result.type).toBe("BORROW");
    });

    it("should accept optional phone in E.164 format", () => {
        const data = {
            accountId: "550e8400-e29b-41d4-a716-446655440000",
            type: "LENT" as const,
            partyName: "Test",
            partyPhone: "+14155552671",
            totalAmount: 100,
            debtDate: "2025-01-15",
        };
        const result = createDebtSchema.parse(data);
        expect(result.partyPhone).toBe("+14155552671");
    });

    it("should reject invalid phone format", () => {
        expect(() =>
            createDebtSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                type: "LENT",
                partyName: "Test",
                partyPhone: "1234567890", // missing +
                totalAmount: 100,
                debtDate: "2025-01-15",
            })
        ).toThrow();
    });

    it("should validate and accept phoneNumber formats", () => {
        const data1 = {
            accountId: "550e8400-e29b-41d4-a716-446655440000",
            type: "LENT" as const,
            partyName: "Test",
            phoneNumber: "+919876543210",
            totalAmount: 100,
            debtDate: "2025-01-15",
        };
        const res1 = createDebtSchema.parse(data1);
        expect(res1.phoneNumber).toBe("+919876543210");

        const data2 = {
            accountId: "550e8400-e29b-41d4-a716-446655440000",
            type: "LENT" as const,
            partyName: "Test",
            phoneNumber: "919876543210",
            totalAmount: 100,
            debtDate: "2025-01-15",
        };
        const res2 = createDebtSchema.parse(data2);
        expect(res2.phoneNumber).toBe("919876543210");
    });

    it("should reject non-digit characters in phoneNumber", () => {
        expect(() =>
            createDebtSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                type: "LENT",
                partyName: "Test",
                phoneNumber: "987654-3210",
                totalAmount: 100,
                debtDate: "2025-01-15",
            })
        ).toThrow();
    });

    it("should reject a party name that is too short", () => {
        expect(() =>
            createDebtSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                type: "LENT",
                partyName: "J",
                totalAmount: 100,
                debtDate: "2025-01-15",
            })
        ).toThrow();
    });

    it("should reject zero amount", () => {
        expect(() =>
            createDebtSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                type: "BORROW",
                partyName: "Test Person",
                totalAmount: 0,
                debtDate: "2025-01-15",
            })
        ).toThrow();
    });

    it("should reject negative amount", () => {
        expect(() =>
            createDebtSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                type: "BORROW",
                partyName: "Test Person",
                totalAmount: -100,
                debtDate: "2025-01-15",
            })
        ).toThrow();
    });

    it("should accept optional note", () => {
        const data = {
            accountId: "550e8400-e29b-41d4-a716-446655440000",
            type: "LENT" as const,
            partyName: "John",
            totalAmount: 500,
            debtDate: "2025-01-15",
            note: "For car repair",
        };
        const result = createDebtSchema.parse(data);
        expect(result.note).toBe("For car repair");
    });

    it("should reject note exceeding 500 characters", () => {
        expect(() =>
            createDebtSchema.parse({
                accountId: "550e8400-e29b-41d4-a716-446655440000",
                type: "LENT",
                partyName: "John",
                totalAmount: 500,
                debtDate: "2025-01-15",
                note: "A".repeat(501),
            })
        ).toThrow();
    });
});

describe("updateDebtSchema", () => {
    it("should allow partial updates", () => {
        const result = updateDebtSchema.parse({ partyName: "Updated Name" });
        expect(result.partyName).toBe("Updated Name");
    });

    it("should allow empty object", () => {
        const result = updateDebtSchema.parse({});
        expect(result).toEqual({});
    });
});

describe("debtParamsSchema", () => {
    it("should accept a valid UUID", () => {
        const result = debtParamsSchema.parse({
            id: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject invalid UUID", () => {
        expect(() => debtParamsSchema.parse({ id: "invalid" })).toThrow();
    });
});

describe("debtQuerySchema", () => {
    it("should accept valid filters", () => {
        const result = debtQuerySchema.parse({
            type: "LENT",
            status: "PENDING",
        });
        expect(result.type).toBe("LENT");
        expect(result.status).toBe("PENDING");
    });

    it("should accept empty query", () => {
        const result = debtQuerySchema.parse({});
        expect(result.type).toBeUndefined();
    });

    it("should reject invalid debt type", () => {
        expect(() => debtQuerySchema.parse({ type: "INVALID" })).toThrow();
    });

    it("should reject invalid status", () => {
        expect(() => debtQuerySchema.parse({ status: "INVALID" })).toThrow();
    });
});
