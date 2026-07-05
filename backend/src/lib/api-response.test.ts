import { describe, it, expect } from "vitest";
import { ApiError, successResponse, errorResponse } from "./api-response";

describe("ApiError", () => {
    it("should create an error with the given status code and message", () => {
        const error = new ApiError(404, "Not found");

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe("Not found");
        expect(error.name).toBe("ApiError");
    });

    it("should include optional errors detail", () => {
        const errors = [{ field: "email", message: "invalid" }];
        const error = new ApiError(400, "Validation failed", errors);

        expect(error.errors).toEqual(errors);
    });

    it("should default errors to undefined", () => {
        const error = new ApiError(500, "Server error");
        expect(error.errors).toBeUndefined();
    });

    it("should have a stack trace", () => {
        const error = new ApiError(400, "Bad request");
        expect(error.stack).toBeDefined();
    });
});

describe("successResponse", () => {
    it("should call reply.status().send() with success payload", () => {
        const sendMock = vi.fn();
        const statusMock = vi.fn(() => ({ send: sendMock }));
        const reply = { status: statusMock } as any;

        successResponse(reply, 200, "OK", { id: 1 });

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(sendMock).toHaveBeenCalledWith({
            success: true,
            message: "OK",
            data: { id: 1 },
        });
    });

    it("should send response without data when data is undefined", () => {
        const sendMock = vi.fn();
        const statusMock = vi.fn(() => ({ send: sendMock }));
        const reply = { status: statusMock } as any;

        successResponse(reply, 201, "Created");

        expect(sendMock).toHaveBeenCalledWith({
            success: true,
            message: "Created",
            data: undefined,
        });
    });
});

describe("errorResponse", () => {
    it("should call reply.status().send() with error payload", () => {
        const sendMock = vi.fn();
        const statusMock = vi.fn(() => ({ send: sendMock }));
        const reply = { status: statusMock } as any;

        errorResponse(reply, 400, "Bad request", { field: "email" });

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith({
            success: false,
            message: "Bad request",
            errors: { field: "email" },
        });
    });

    it("should handle error response without errors detail", () => {
        const sendMock = vi.fn();
        const statusMock = vi.fn(() => ({ send: sendMock }));
        const reply = { status: statusMock } as any;

        errorResponse(reply, 500, "Internal error");

        expect(sendMock).toHaveBeenCalledWith({
            success: false,
            message: "Internal error",
            errors: undefined,
        });
    });
});
