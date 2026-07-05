import { describe, it, expect } from "vitest";
import {
    createCategorySchema,
    updateCategorySchema,
    categoryParamsSchema,
    categoryQuerySchema,
} from "./categories.schema";

describe("createCategorySchema", () => {
    it("should validate a correct create category payload", () => {
        const data = {
            name: "Food",
            categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
            type: "EXPENSE" as const,
        };
        const result = createCategorySchema.parse(data);
        expect(result.name).toBe("Food");
        expect(result.type).toBe("EXPENSE");
    });

    it("should accept optional color field", () => {
        const data = {
            name: "Salary",
            categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
            type: "INCOME" as const,
            color: "#FF5733",
        };
        const result = createCategorySchema.parse(data);
        expect(result.color).toBe("#FF5733");
    });

    it("should reject a name that is too short", () => {
        expect(() =>
            createCategorySchema.parse({
                name: "A",
                categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
                type: "EXPENSE",
            })
        ).toThrow();
    });

    it("should reject a name that is too long", () => {
        expect(() =>
            createCategorySchema.parse({
                name: "A".repeat(101),
                categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
                type: "EXPENSE",
            })
        ).toThrow();
    });

    it("should reject invalid type", () => {
        expect(() =>
            createCategorySchema.parse({
                name: "Food",
                categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
                type: "INVALID",
            })
        ).toThrow();
    });

    it("should reject invalid categoryIconId (not a UUID)", () => {
        expect(() =>
            createCategorySchema.parse({
                name: "Food",
                categoryIconId: "not-a-uuid",
                type: "EXPENSE",
            })
        ).toThrow();
    });

    it("should reject color that is too long", () => {
        expect(() =>
            createCategorySchema.parse({
                name: "Food",
                categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
                type: "EXPENSE",
                color: "A".repeat(21),
            })
        ).toThrow();
    });
});

describe("updateCategorySchema", () => {
    it("should allow partial updates", () => {
        const result = updateCategorySchema.parse({ name: "Updated Food" });
        expect(result.name).toBe("Updated Food");
        expect(result.type).toBeUndefined();
    });

    it("should allow empty object (no updates)", () => {
        const result = updateCategorySchema.parse({});
        expect(result).toEqual({});
    });
});

describe("categoryParamsSchema", () => {
    it("should accept a valid UUID", () => {
        const result = categoryParamsSchema.parse({
            id: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject an invalid UUID", () => {
        expect(() =>
            categoryParamsSchema.parse({ id: "not-a-uuid" })
        ).toThrow();
    });
});

describe("categoryQuerySchema", () => {
    it("should accept valid type filter", () => {
        const result = categoryQuerySchema.parse({ type: "INCOME" });
        expect(result.type).toBe("INCOME");
    });

    it("should accept empty query (no filter)", () => {
        const result = categoryQuerySchema.parse({});
        expect(result.type).toBeUndefined();
    });

    it("should reject invalid type filter", () => {
        expect(() =>
            categoryQuerySchema.parse({ type: "INVALID" })
        ).toThrow();
    });
});
