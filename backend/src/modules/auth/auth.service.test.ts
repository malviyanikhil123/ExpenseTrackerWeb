import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service";
import { ApiError } from "../../lib/api-response";

// Mock the auth repository
vi.mock("./auth.repository", () => ({
    authRepository: {
        findByEmail: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        updatePassword: vi.fn(),
    },
}));

// Mock the password utils
vi.mock("../../lib/password", () => ({
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
}));

vi.mock("../../db/seeds/categories-seeder", () => ({
    seedDefaultCategoriesForUser: vi.fn().mockResolvedValue(undefined),
}));

import { authRepository } from "./auth.repository";
import { hashPassword, verifyPassword } from "../../lib/password";

const mockFastify = {
    jwt: {
        sign: vi.fn(),
        verify: vi.fn(),
    },
} as any;

describe("AuthService", () => {
    let authService: AuthService;

    beforeEach(() => {
        vi.clearAllMocks();
        authService = new AuthService(mockFastify);
    });

    describe("register", () => {
        it("should register a new user successfully", async () => {
            vi.mocked(authRepository.findByEmail).mockResolvedValue(null);
            vi.mocked(hashPassword).mockResolvedValue("hashed-password");
            vi.mocked(authRepository.create).mockResolvedValue({
                id: "user-123",
                fullName: "John Doe",
                email: "john@example.com",
                password: "hashed-password",
                provider: "LOCAL",
                avatar: null,
                isActive: true,
                isEmailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });
            vi.mocked(mockFastify.jwt.sign)
                .mockResolvedValueOnce("access-token")
                .mockResolvedValueOnce("refresh-token");

            const result = await authService.register({
                name: "John Doe",
                email: "john@example.com",
                password: "Password123!",
            });

            expect(result.user.id).toBe("user-123");
            expect(result.user.name).toBe("John Doe");
            expect(result.user.email).toBe("john@example.com");
            expect(result.accessToken).toBe("access-token");
            expect(result.refreshToken).toBe("refresh-token");
            expect(hashPassword).toHaveBeenCalledWith("Password123!");
        });

        it("should throw 409 if email already exists", async () => {
            vi.mocked(authRepository.findByEmail).mockResolvedValue({
                id: "existing-user",
                fullName: "Existing",
                email: "john@example.com",
                password: "hashed",
                provider: "LOCAL",
                avatar: null,
                isActive: true,
                isEmailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            await expect(
                authService.register({
                    name: "John Doe",
                    email: "john@example.com",
                    password: "Password123!",
                })
            ).rejects.toThrow(ApiError);

            try {
                await authService.register({
                    name: "John Doe",
                    email: "john@example.com",
                    password: "Password123!",
                });
            } catch (error) {
                expect((error as ApiError).statusCode).toBe(409);
            }
        });
    });

    describe("login", () => {
        it("should login successfully with valid credentials", async () => {
            vi.mocked(authRepository.findByEmail).mockResolvedValue({
                id: "user-123",
                fullName: "John Doe",
                email: "john@example.com",
                password: "hashed-password",
                provider: "LOCAL",
                avatar: null,
                isActive: true,
                isEmailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });
            vi.mocked(verifyPassword).mockResolvedValue(true);
            vi.mocked(mockFastify.jwt.sign)
                .mockResolvedValueOnce("access-token")
                .mockResolvedValueOnce("refresh-token");

            const result = await authService.login({
                email: "john@example.com",
                password: "Password123!",
            });

            expect(result.user.id).toBe("user-123");
            expect(result.accessToken).toBe("access-token");
            expect(result.refreshToken).toBe("refresh-token");
        });

        it("should throw 401 if user not found", async () => {
            vi.mocked(authRepository.findByEmail).mockResolvedValue(null);

            await expect(
                authService.login({
                    email: "nobody@example.com",
                    password: "Password123!",
                })
            ).rejects.toThrow(ApiError);
        });

        it("should throw 401 if password is invalid", async () => {
            vi.mocked(authRepository.findByEmail).mockResolvedValue({
                id: "user-123",
                fullName: "John Doe",
                email: "john@example.com",
                password: "hashed-password",
                provider: "LOCAL",
                avatar: null,
                isActive: true,
                isEmailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });
            vi.mocked(verifyPassword).mockResolvedValue(false);

            await expect(
                authService.login({
                    email: "john@example.com",
                    password: "WrongPassword!",
                })
            ).rejects.toThrow(ApiError);
        });
    });

    describe("refresh", () => {
        it("should refresh tokens successfully", async () => {
            vi.mocked(mockFastify.jwt.verify).mockResolvedValue({
                sub: "user-123",
                email: "john@example.com",
            });
            vi.mocked(authRepository.findById).mockResolvedValue({
                id: "user-123",
                fullName: "John Doe",
                email: "john@example.com",
                password: "hashed",
                provider: "LOCAL",
                avatar: null,
                isActive: true,
                isEmailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });
            vi.mocked(mockFastify.jwt.sign)
                .mockResolvedValueOnce("new-access-token")
                .mockResolvedValueOnce("new-refresh-token");

            const result = await authService.refresh("old-refresh-token");

            expect(result.accessToken).toBe("new-access-token");
            expect(result.refreshToken).toBe("new-refresh-token");
        });

        it("should throw 401 if user not found after token verification", async () => {
            vi.mocked(mockFastify.jwt.verify).mockResolvedValue({
                sub: "deleted-user",
                email: "deleted@example.com",
            });
            vi.mocked(authRepository.findById).mockResolvedValue(null);

            await expect(
                authService.refresh("some-token")
            ).rejects.toThrow(ApiError);
        });
    });

    describe("logout", () => {
        it("should return a logout message", async () => {
            const result = await authService.logout();
            expect(result.message).toBe("Logged out successfully");
        });
    });

    describe("changePassword", () => {
        it("should change password successfully", async () => {
            vi.mocked(authRepository.findById).mockResolvedValue({
                id: "user-123",
                fullName: "John",
                email: "john@example.com",
                password: "old-hashed",
                provider: "LOCAL",
                avatar: null,
                isActive: true,
                isEmailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });
            vi.mocked(verifyPassword).mockResolvedValue(true);
            vi.mocked(hashPassword).mockResolvedValue("new-hashed");
            vi.mocked(authRepository.updatePassword).mockResolvedValue({
                id: "user-123",
                fullName: "John",
                email: "john@example.com",
                password: "new-hashed",
                provider: "LOCAL",
                avatar: null,
                isActive: true,
                isEmailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const result = await authService.changePassword("user-123", {
                currentPassword: "OldPassword1!",
                newPassword: "NewPassword2!",
            });

            expect(result.message).toBe("Password changed successfully");
            expect(authRepository.updatePassword).toHaveBeenCalledWith(
                "user-123",
                "new-hashed"
            );
        });

        it("should throw 404 if user not found", async () => {
            vi.mocked(authRepository.findById).mockResolvedValue(null);

            await expect(
                authService.changePassword("nonexistent", {
                    currentPassword: "OldPass123!",
                    newPassword: "NewPass123!",
                })
            ).rejects.toThrow(ApiError);
        });

        it("should throw 400 if current password is incorrect", async () => {
            vi.mocked(authRepository.findById).mockResolvedValue({
                id: "user-123",
                fullName: "John",
                email: "john@example.com",
                password: "hashed",
                provider: "LOCAL",
                avatar: null,
                isActive: true,
                isEmailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });
            vi.mocked(verifyPassword).mockResolvedValue(false);

            await expect(
                authService.changePassword("user-123", {
                    currentPassword: "WrongOldPass!",
                    newPassword: "NewPassword2!",
                })
            ).rejects.toThrow(ApiError);
        });
    });
});
