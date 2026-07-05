import { describe, it, expect } from "vitest";
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "./pagination";

describe("pagination constants", () => {
    it("should have DEFAULT_PAGE of 1", () => {
        expect(DEFAULT_PAGE).toBe(1);
    });

    it("should have DEFAULT_LIMIT of 10", () => {
        expect(DEFAULT_LIMIT).toBe(10);
    });

    it("should have MAX_LIMIT of 100", () => {
        expect(MAX_LIMIT).toBe(100);
    });

    it("should ensure MAX_LIMIT >= DEFAULT_LIMIT", () => {
        expect(MAX_LIMIT).toBeGreaterThanOrEqual(DEFAULT_LIMIT);
    });

    it("should ensure DEFAULT_PAGE >= 1", () => {
        expect(DEFAULT_PAGE).toBeGreaterThanOrEqual(1);
    });
});
