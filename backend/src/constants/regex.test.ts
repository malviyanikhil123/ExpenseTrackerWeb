import { describe, it, expect } from "vitest";
import { PASSWORD_REGEX, PHONE_REGEX } from "./regex";

describe("PASSWORD_REGEX", () => {
    it("should match a valid password with lowercase, uppercase, digit, and special char", () => {
        expect(PASSWORD_REGEX.test("MyPass1!")).toBe(true);
    });

    it("should match passwords with various special characters", () => {
        expect(PASSWORD_REGEX.test("Test@123")).toBe(true);
        expect(PASSWORD_REGEX.test("Pass$word1")).toBe(true);
        expect(PASSWORD_REGEX.test("Hello!World2")).toBe(true);
    });

    it("should reject passwords without uppercase", () => {
        expect(PASSWORD_REGEX.test("mypass1!")).toBe(false);
    });

    it("should reject passwords without lowercase", () => {
        expect(PASSWORD_REGEX.test("MYPASS1!")).toBe(false);
    });

    it("should reject passwords without digit", () => {
        expect(PASSWORD_REGEX.test("MyPass!!")).toBe(false);
    });

    it("should reject passwords without special character", () => {
        expect(PASSWORD_REGEX.test("MyPass123")).toBe(false);
    });

    it("should reject passwords shorter than 8 characters", () => {
        expect(PASSWORD_REGEX.test("Pa1!")).toBe(false);
    });
});

describe("PHONE_REGEX", () => {
    it("should match valid E.164 phone numbers", () => {
        expect(PHONE_REGEX.test("+14155552671")).toBe(true);
        expect(PHONE_REGEX.test("+919876543210")).toBe(true);
        expect(PHONE_REGEX.test("+12")).toBe(true);
    });

    it("should reject phone without + prefix", () => {
        expect(PHONE_REGEX.test("14155552671")).toBe(false);
    });

    it("should reject phone starting with +0", () => {
        expect(PHONE_REGEX.test("+014155552671")).toBe(false);
    });

    it("should reject empty string", () => {
        expect(PHONE_REGEX.test("")).toBe(false);
    });

    it("should reject phone with spaces", () => {
        expect(PHONE_REGEX.test("+1 415 555 2671")).toBe(false);
    });
});
