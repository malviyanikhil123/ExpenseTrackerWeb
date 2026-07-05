import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword", () => {
    it("should return a bcrypt hash string", async () => {
        const password = "MySecurePass123!";
        const hash = await hashPassword(password);

        // bcrypt hashes start with $2b$ (or $2a$)
        expect(hash).toMatch(/^\$2[ab]\$/);
        expect(hash.length).toBeGreaterThan(50);
    });

    it("should produce different hashes for the same password (due to salt)", async () => {
        const password = "SamePassword456!";
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        expect(hash1).not.toBe(hash2);
    });
});

describe("verifyPassword", () => {
    it("should return true for a correct password", async () => {
        const password = "CorrectPassword789!";
        const hash = await hashPassword(password);

        const result = await verifyPassword(password, hash);
        expect(result).toBe(true);
    });

    it("should return false for an incorrect password", async () => {
        const password = "CorrectPassword789!";
        const hash = await hashPassword(password);

        const result = await verifyPassword("WrongPassword!", hash);
        expect(result).toBe(false);
    });
});
