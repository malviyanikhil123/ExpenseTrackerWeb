import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategoriesService } from "./categories.service";
import { ApiError } from "../../lib/api-response";

vi.mock("./categories.repository", () => ({
    categoriesRepository: {
        findByName: vi.fn(),
        findIconById: vi.fn(),
        create: vi.fn(),
        findAll: vi.fn(),
        findById: vi.fn(),
        findDuplicate: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
    },
}));

import { categoriesRepository } from "./categories.repository";

const USER_ID = "user-123";

describe("CategoriesService", () => {
    let service: CategoriesService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new CategoriesService();
    });

    describe("create", () => {
        it("should create a category successfully", async () => {
            vi.mocked(categoriesRepository.findByName).mockResolvedValue(null);
            vi.mocked(categoriesRepository.findIconById).mockResolvedValue({ id: "icon-1" } as any);
            vi.mocked(categoriesRepository.create).mockResolvedValue({
                id: "cat-1",
                userId: USER_ID,
                categoryIconId: "icon-1",
                name: "Food",
                type: "EXPENSE",
                color: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as any);

            const result = await service.create(USER_ID, {
                name: "Food",
                categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
                type: "EXPENSE",
            });

            expect(result.name).toBe("Food");
            expect(categoriesRepository.create).toHaveBeenCalled();
        });

        it("should throw 409 if category name already exists", async () => {
            vi.mocked(categoriesRepository.findByName).mockResolvedValue({
                id: "cat-1",
                name: "Food",
            } as any);

            await expect(
                service.create(USER_ID, {
                    name: "Food",
                    categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
                    type: "EXPENSE",
                })
            ).rejects.toThrow(ApiError);
        });

        it("should throw 404 if category icon is not found", async () => {
            vi.mocked(categoriesRepository.findByName).mockResolvedValue(null);
            vi.mocked(categoriesRepository.findIconById).mockResolvedValue(null);

            await expect(
                service.create(USER_ID, {
                    name: "Food",
                    categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
                    type: "EXPENSE",
                })
            ).rejects.toThrow(ApiError);

            try {
                await service.create(USER_ID, {
                    name: "Food",
                    categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
                    type: "EXPENSE",
                });
            } catch (error) {
                expect((error as ApiError).statusCode).toBe(404);
                expect((error as ApiError).message).toBe("Category icon not found.");
            }
        });
    });

    describe("findAll", () => {
        it("should return all categories", async () => {
            vi.mocked(categoriesRepository.findAll).mockResolvedValue([
                { id: "cat-1", name: "Food" },
                { id: "cat-2", name: "Transport" },
            ] as any);

            const result = await service.findAll(USER_ID, {});
            expect(result).toHaveLength(2);
        });

        it("should filter by type", async () => {
            vi.mocked(categoriesRepository.findAll).mockResolvedValue([
                { id: "cat-1", name: "Salary", type: "INCOME" },
            ] as any);

            const result = await service.findAll(USER_ID, { type: "INCOME" });
            expect(categoriesRepository.findAll).toHaveBeenCalledWith(USER_ID, "INCOME");
        });
    });

    describe("findById", () => {
        it("should return a category by id", async () => {
            vi.mocked(categoriesRepository.findById).mockResolvedValue({
                id: "cat-1",
                name: "Food",
            } as any);

            const result = await service.findById(USER_ID, "cat-1");
            expect(result.id).toBe("cat-1");
        });

        it("should throw 404 if category not found", async () => {
            vi.mocked(categoriesRepository.findById).mockResolvedValue(null);

            await expect(
                service.findById(USER_ID, "nonexistent")
            ).rejects.toThrow(ApiError);
        });
    });

    describe("update", () => {
        it("should update a category successfully", async () => {
            vi.mocked(categoriesRepository.findById).mockResolvedValue({
                id: "cat-1",
                name: "Food",
                type: "EXPENSE",
            } as any);
            vi.mocked(categoriesRepository.findDuplicate).mockResolvedValue(null);
            vi.mocked(categoriesRepository.findIconById).mockResolvedValue({ id: "icon-1" } as any);
            vi.mocked(categoriesRepository.update).mockResolvedValue({
                id: "cat-1",
                name: "Groceries",
                type: "EXPENSE",
            } as any);

            const result = await service.update(USER_ID, "cat-1", {
                name: "Groceries",
                categoryIconId: "550e8400-e29b-41d4-a716-446655440000",
            });

            expect(result.name).toBe("Groceries");
        });

        it("should throw 409 if duplicate name exists", async () => {
            vi.mocked(categoriesRepository.findById).mockResolvedValue({
                id: "cat-1",
                name: "Food",
                type: "EXPENSE",
            } as any);
            vi.mocked(categoriesRepository.findDuplicate).mockResolvedValue({
                id: "cat-2",
                name: "Groceries",
            } as any);

            await expect(
                service.update(USER_ID, "cat-1", { name: "Groceries" })
            ).rejects.toThrow(ApiError);
        });

        it("should throw 404 if category not found during update", async () => {
            vi.mocked(categoriesRepository.findById).mockResolvedValue(null);

            await expect(
                service.update(USER_ID, "nonexistent", { name: "New Name" })
            ).rejects.toThrow(ApiError);
        });

        it("should throw 404 if category icon is not found during update", async () => {
            vi.mocked(categoriesRepository.findById).mockResolvedValue({
                id: "cat-1",
                name: "Food",
                type: "EXPENSE",
            } as any);
            vi.mocked(categoriesRepository.findDuplicate).mockResolvedValue(null);
            vi.mocked(categoriesRepository.findIconById).mockResolvedValue(null);

            await expect(
                service.update(USER_ID, "cat-1", {
                    categoryIconId: "nonexistent-icon",
                })
            ).rejects.toThrow(ApiError);
        });
    });

    describe("delete", () => {
        it("should soft delete a category", async () => {
            vi.mocked(categoriesRepository.findById).mockResolvedValue({
                id: "cat-1",
                name: "Food",
            } as any);
            vi.mocked(categoriesRepository.softDelete).mockResolvedValue({
                id: "cat-1",
                deletedAt: new Date(),
            } as any);

            const result = await service.delete(USER_ID, "cat-1");
            expect(categoriesRepository.softDelete).toHaveBeenCalledWith(
                USER_ID,
                "cat-1"
            );
        });

        it("should throw 404 if category not found during delete", async () => {
            vi.mocked(categoriesRepository.findById).mockResolvedValue(null);

            await expect(
                service.delete(USER_ID, "nonexistent")
            ).rejects.toThrow(ApiError);
        });
    });
});
