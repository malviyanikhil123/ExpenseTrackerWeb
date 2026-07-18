import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { ZodError } from "zod";
import { registerRoutes } from "./routes";
import { authenticate } from "./middleware/auth";

export async function buildApp() {
    const app = Fastify({
        logger: true,
        bodyLimit: 10 * 1024 * 1024, // 10MB payload limit for base64 image strings
    });

    await app.register(cors, {
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });

    await app.register(fastifyJwt, {
        secret: env.JWT_SECRET,
    });

    app.decorate("authenticate", authenticate);

    // Global Error Handler to intercept database validation & zod errors
    app.setErrorHandler((error: any, request, reply) => {
        request.log.error(error);

        // Handle Zod Validation Errors
        if (error instanceof ZodError) {
            const formattedErrors = error.issues.map(err => `${err.path.join(".")}: ${err.message}`).join(", ");
            return reply.status(400).send({
                success: false,
                statusCode: 400,
                error: "Bad Request",
                message: `Validation failed: ${formattedErrors}`,
            });
        }

        const message = error.message || "";
        const isDbError = 
            message.toLowerCase().includes("database") || 
            message.toLowerCase().includes("constraint") || 
            message.toLowerCase().includes("unique") || 
            message.toLowerCase().includes("foreign") || 
            message.toLowerCase().includes("drizzle") ||
            message.toLowerCase().includes("sql") ||
            message.toLowerCase().includes("violates") ||
            error.name === "DatabaseError";

        // Handle Database Query / Constraint Failures
        if (isDbError) {
            return reply.status(400).send({
                success: false,
                statusCode: 400,
                error: "Bad Request",
                message: "A data validation error occurred. Please check that your inputs are correct and do not conflict.",
            });
        }

        // Generic fallback for uncaught 500s or custom errors
        const statusCode = error.statusCode || 500;
        return reply.status(statusCode).send({
            success: false,
            statusCode,
            error: statusCode === 500 ? "Internal Server Error" : error.name,
            message: statusCode === 500 ? "An unexpected error occurred. Please try again later." : error.message,
        });
    });

    app.get("/", async () => {
        return {
            success: true,
            message: "Expense Tracker API",
        };
    });

    await registerRoutes(app);

    return app;
}