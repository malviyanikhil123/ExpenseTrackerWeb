import { describe, it, expect } from "vitest";
import { hashRefreshToken } from "./crypto";

describe("hashRefreshToken", () => {
    it("should return a SHA-256 hex digest", () => {
        const token = "some-refresh-token";
        const hash = hashRefreshToken(token);

        // SHA-256 hex digest is 64 characters
        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should produce deterministic output for the same input", () => {
        const token = "deterministic-token";
        const hash1 = hashRefreshToken(token);
        const hash2 = hashRefreshToken(token);

        expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", () => {
        const hash1 = hashRefreshToken("token-a");
        const hash2 = hashRefreshToken("token-b");

        expect(hash1).not.toBe(hash2);
    });

    it("should handle empty string", () => {
        const hash = hashRefreshToken("");
        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
});
