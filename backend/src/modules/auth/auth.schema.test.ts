import { describe, it, expect } from "vitest";
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    logoutSchema,
    changePasswordSchema,
} from "./auth.schema";

describe("registerSchema", () => {
    it("should validate a correct registration payload", () => {
        const data = {
            name: "John Doe",
            email: "john@example.com",
            password: "Password123!",
        };
        const result = registerSchema.parse(data);
        expect(result).toEqual(data);
    });

    it("should reject a name that is too short", () => {
        expect(() =>
            registerSchema.parse({
                name: "J",
                email: "john@example.com",
                password: "Password123!",
            })
        ).toThrow();
    });

    it("should reject a name that is too long", () => {
        expect(() =>
            registerSchema.parse({
                name: "J".repeat(101),
                email: "john@example.com",
                password: "Password123!",
            })
        ).toThrow();
    });

    it("should reject an invalid email", () => {
        expect(() =>
            registerSchema.parse({
                name: "John",
                email: "not-an-email",
                password: "Password123!",
            })
        ).toThrow();
    });

    it("should reject a password shorter than 8 characters", () => {
        expect(() =>
            registerSchema.parse({
                name: "John",
                email: "john@example.com",
                password: "Short1!",
            })
        ).toThrow();
    });

    it("should reject a password longer than 128 characters", () => {
        expect(() =>
            registerSchema.parse({
                name: "John",
                email: "john@example.com",
                password: "A".repeat(129),
            })
        ).toThrow();
    });

    it("should trim email and name", () => {
        const result = registerSchema.parse({
            name: "  John Doe  ",
            email: "  john@example.com  ",
            password: "Password123!",
        });
        expect(result.name).toBe("John Doe");
        expect(result.email).toBe("john@example.com");
    });

    it("should reject missing fields", () => {
        expect(() => registerSchema.parse({})).toThrow();
        expect(() => registerSchema.parse({ name: "John" })).toThrow();
    });
});

describe("loginSchema", () => {
    it("should validate a correct login payload", () => {
        const data = {
            email: "john@example.com",
            password: "Password123!",
        };
        const result = loginSchema.parse(data);
        expect(result).toEqual(data);
    });

    it("should reject missing email", () => {
        expect(() =>
            loginSchema.parse({ password: "Password123!" })
        ).toThrow();
    });

    it("should reject missing password", () => {
        expect(() =>
            loginSchema.parse({ email: "john@example.com" })
        ).toThrow();
    });
});

describe("refreshTokenSchema", () => {
    it("should validate a valid refresh token", () => {
        const result = refreshTokenSchema.parse({
            refreshToken: "some-valid-token",
        });
        expect(result.refreshToken).toBe("some-valid-token");
    });

    it("should reject an empty refresh token", () => {
        expect(() =>
            refreshTokenSchema.parse({ refreshToken: "" })
        ).toThrow();
    });

    it("should reject missing refresh token", () => {
        expect(() => refreshTokenSchema.parse({})).toThrow();
    });
});

describe("logoutSchema", () => {
    it("should validate a valid logout payload", () => {
        const result = logoutSchema.parse({
            refreshToken: "some-token",
        });
        expect(result.refreshToken).toBe("some-token");
    });

    it("should reject empty refresh token", () => {
        expect(() =>
            logoutSchema.parse({ refreshToken: "" })
        ).toThrow();
    });
});

describe("changePasswordSchema", () => {
    it("should validate when current and new passwords differ", () => {
        const result = changePasswordSchema.parse({
            currentPassword: "OldPassword1!",
            newPassword: "NewPassword2!",
        });
        expect(result.currentPassword).toBe("OldPassword1!");
        expect(result.newPassword).toBe("NewPassword2!");
    });

    it("should reject when current and new passwords are the same", () => {
        expect(() =>
            changePasswordSchema.parse({
                currentPassword: "SamePassword1!",
                newPassword: "SamePassword1!",
            })
        ).toThrow();
    });

    it("should reject when new password is too short", () => {
        expect(() =>
            changePasswordSchema.parse({
                currentPassword: "OldPassword1!",
                newPassword: "Short1!",
            })
        ).toThrow();
    });
});
