import { FastifyReply } from "fastify";

export class ApiError extends Error {
    statusCode: number;
    errors?: unknown;

    constructor(
        statusCode: number,
        message: string,
        errors?: unknown,
    ) {
        super(message);

        this.name = "ApiError";
        this.statusCode = statusCode;
        this.errors = errors;

        Error.captureStackTrace?.(this, ApiError);
    }
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

interface ErrorResponse {
    success: boolean;
    message: string;
    errors?: unknown;
}

export function successResponse<T>(
    reply: FastifyReply,
    statusCode: number,
    message: string,
    data?: T
) {
    return reply.status(statusCode).send({
        success: true,
        message,
        data,
    });
}

export function errorResponse(
    reply: FastifyReply,
    statusCode: number,
    message: string,
    errors?: unknown
) {
    return reply.status(statusCode).send({
        success: false,
        message,
        errors,
    });
}