import { describe, it, expect } from "vitest";
import {
    updateProfileSchema,
    updatePreferencesSchema,
    changePasswordSchema,
} from "./profile.schema";

describe("updateProfileSchema", () => {
    it("should accept valid optional fullName", () => {
        const result = updateProfileSchema.parse({ fullName: "John Doe" });
        expect(result.fullName).toBe("John Doe");
    });

    it("should accept valid optional avatarUrl", () => {
        const result = updateProfileSchema.parse({
            avatarUrl: "https://example.com/avatar.jpg",
        });
        expect(result.avatarUrl).toBe("https://example.com/avatar.jpg");
    });

    it("should allow empty object", () => {
        const result = updateProfileSchema.parse({});
        expect(result).toEqual({});
    });

    it("should reject fullName shorter than 2 characters", () => {
        expect(() =>
            updateProfileSchema.parse({ fullName: "J" })
        ).toThrow();
    });

    it("should reject fullName longer than 100 characters", () => {
        expect(() =>
            updateProfileSchema.parse({ fullName: "A".repeat(101) })
        ).toThrow();
    });

    it("should reject invalid avatarUrl", () => {
        expect(() =>
            updateProfileSchema.parse({ avatarUrl: "not-a-url" })
        ).toThrow();
    });
});

describe("updatePreferencesSchema", () => {
    it("should validate valid preferences", () => {
        const result = updatePreferencesSchema.parse({
            currency: "USD",
            theme: "DARK",
        });
        expect(result.currency).toBe("USD");
        expect(result.theme).toBe("DARK");
    });

    it("should reject currency not exactly 3 chars", () => {
        expect(() =>
            updatePreferencesSchema.parse({
                currency: "US",
                theme: "LIGHT",
            })
        ).toThrow();
    });

    it("should reject invalid theme", () => {
        expect(() =>
            updatePreferencesSchema.parse({
                currency: "USD",
                theme: "BLUE",
            })
        ).toThrow();
    });

    it("should accept all valid themes", () => {
        for (const theme of ["LIGHT", "DARK", "SYSTEM"]) {
            const result = updatePreferencesSchema.parse({
                currency: "INR",
                theme,
            });
            expect(result.theme).toBe(theme);
        }
    });
});

describe("changePasswordSchema (profile)", () => {
    it("should validate when passwords differ", () => {
        const result = changePasswordSchema.parse({
            currentPassword: "OldPassword1!",
            newPassword: "NewPassword2!",
        });
        expect(result.currentPassword).toBe("OldPassword1!");
        expect(result.newPassword).toBe("NewPassword2!");
    });

    it("should reject when passwords are the same", () => {
        expect(() =>
            changePasswordSchema.parse({
                currentPassword: "SamePass123!",
                newPassword: "SamePass123!",
            })
        ).toThrow();
    });

    it("should reject new password shorter than 8 characters", () => {
        expect(() =>
            changePasswordSchema.parse({
                currentPassword: "OldPassword1!",
                newPassword: "Short1!",
            })
        ).toThrow();
    });

    it("should reject current password shorter than 8 characters", () => {
        expect(() =>
            changePasswordSchema.parse({
                currentPassword: "Short1!",
                newPassword: "NewPassword2!",
            })
        ).toThrow();
    });
});
