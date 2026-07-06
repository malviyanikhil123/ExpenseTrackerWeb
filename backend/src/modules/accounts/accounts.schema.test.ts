import { describe, it, expect } from "vitest";
import {
    createAccountSchema,
    updateAccountSchema,
    accountParamsSchema,
    accountQuerySchema,
} from "./accounts.schema";

describe("createAccountSchema", () => {
    it("should validate a correct create account payload", () => {
        const data = {
            name: "Savings Account",
            type: "BANK" as const,
            openingBalance: 1000,
        };
        const result = createAccountSchema.parse(data);
        expect(result.name).toBe("Savings Account");
        expect(result.type).toBe("BANK");
        expect(result.openingBalance).toBe(1000);
    });

    it("should accept all valid account types", () => {
        const types = ["CASH", "BANK", "UPI", "CREDIT_CARD", "DEBIT_CARD", "E_WALLET"] as const;
        for (const type of types) {
            const result = createAccountSchema.parse({
                name: "Test Account",
                type,
                openingBalance: 0,
            });
            expect(result.type).toBe(type);
        }
    });

    it("should accept optional fields", () => {
        const data = {
            name: "My Card",
            type: "CREDIT_CARD" as const,
            openingBalance: 500,
            description: "Personal credit card",
            color: "#4A90D9",
            isDefault: true,
            isArchived: false,
        };
        const result = createAccountSchema.parse(data);
        expect(result.description).toBe("Personal credit card");
        expect(result.color).toBe("#4A90D9");
        expect(result.isDefault).toBe(true);
        expect(result.isArchived).toBe(false);
    });

    it("should reject a name that is too short", () => {
        expect(() =>
            createAccountSchema.parse({
                name: "A",
                type: "BANK",
                openingBalance: 0,
            })
        ).toThrow();
    });

    it("should reject a negative opening balance", () => {
        expect(() =>
            createAccountSchema.parse({
                name: "Account",
                type: "BANK",
                openingBalance: -100,
            })
        ).toThrow();
    });

    it("should reject invalid account type", () => {
        expect(() =>
            createAccountSchema.parse({
                name: "Account",
                type: "INVALID",
                openingBalance: 0,
            })
        ).toThrow();
    });

    it("should reject description exceeding max length", () => {
        expect(() =>
            createAccountSchema.parse({
                name: "Account",
                type: "BANK",
                openingBalance: 0,
                description: "A".repeat(256),
            })
        ).toThrow();
    });
});

describe("updateAccountSchema", () => {
    it("should allow partial updates (excluding openingBalance)", () => {
        const result = updateAccountSchema.parse({ name: "New Name" });
        expect(result.name).toBe("New Name");
    });

    it("should not allow openingBalance in update", () => {
        const result = updateAccountSchema.parse({
            name: "Updated",
            openingBalance: 999,
        });
        // openingBalance is omitted from the schema, so it should be stripped
        expect((result as any).openingBalance).toBeUndefined();
    });

    it("should allow empty object", () => {
        const result = updateAccountSchema.parse({});
        expect(result).toEqual({});
    });
});

describe("accountParamsSchema", () => {
    it("should accept a valid UUID", () => {
        const result = accountParamsSchema.parse({
            id: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject an invalid UUID", () => {
        expect(() =>
            accountParamsSchema.parse({ id: "not-uuid" })
        ).toThrow();
    });
});

describe("accountQuerySchema", () => {
    it("should accept archived boolean", () => {
        const result = accountQuerySchema.parse({ archived: true });
        expect(result.archived).toBe(true);
    });

    it("should coerce string to boolean for archived", () => {
        const result = accountQuerySchema.parse({ archived: "true" });
        expect(result.archived).toBe(true);

        const resultFalse = accountQuerySchema.parse({ archived: "false" });
        expect(resultFalse.archived).toBe(false);
    });

    it("should accept empty query", () => {
        const result = accountQuerySchema.parse({});
        expect(result.archived).toBeUndefined();
    });
});
