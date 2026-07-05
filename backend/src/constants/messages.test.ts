import { describe, it, expect } from "vitest";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "./messages";

describe("SUCCESS_MESSAGES", () => {
    it("should have all required success messages", () => {
        expect(SUCCESS_MESSAGES.REGISTER_SUCCESS).toBeDefined();
        expect(SUCCESS_MESSAGES.LOGIN_SUCCESS).toBeDefined();
        expect(SUCCESS_MESSAGES.LOGOUT_SUCCESS).toBeDefined();
        expect(SUCCESS_MESSAGES.TOKEN_REFRESHED).toBeDefined();
        expect(SUCCESS_MESSAGES.PROFILE_UPDATED).toBeDefined();
        expect(SUCCESS_MESSAGES.PASSWORD_CHANGED).toBeDefined();
        expect(SUCCESS_MESSAGES.CREATED).toBeDefined();
        expect(SUCCESS_MESSAGES.UPDATED).toBeDefined();
        expect(SUCCESS_MESSAGES.DELETED).toBeDefined();
    });

    it("should have non-empty string messages", () => {
        Object.values(SUCCESS_MESSAGES).forEach((msg) => {
            expect(typeof msg).toBe("string");
            expect(msg.length).toBeGreaterThan(0);
        });
    });
});

describe("ERROR_MESSAGES", () => {
    it("should have all required error messages", () => {
        expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toBeDefined();
        expect(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS).toBeDefined();
        expect(ERROR_MESSAGES.USER_NOT_FOUND).toBeDefined();
        expect(ERROR_MESSAGES.UNAUTHORIZED).toBeDefined();
        expect(ERROR_MESSAGES.FORBIDDEN).toBeDefined();
        expect(ERROR_MESSAGES.INVALID_TOKEN).toBeDefined();
        expect(ERROR_MESSAGES.TOKEN_EXPIRED).toBeDefined();
        expect(ERROR_MESSAGES.INVALID_REFRESH_TOKEN).toBeDefined();
        expect(ERROR_MESSAGES.ACCOUNT_DISABLED).toBeDefined();
        expect(ERROR_MESSAGES.VALIDATION_ERROR).toBeDefined();
        expect(ERROR_MESSAGES.INTERNAL_SERVER_ERROR).toBeDefined();
    });

    it("should have non-empty string messages", () => {
        Object.values(ERROR_MESSAGES).forEach((msg) => {
            expect(typeof msg).toBe("string");
            expect(msg.length).toBeGreaterThan(0);
        });
    });
});
