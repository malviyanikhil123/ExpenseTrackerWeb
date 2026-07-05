import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { authenticate } from "./middleware/auth";
import { registerRoutes } from "./routes";

export async function buildApp() {
    const app = Fastify({
        logger: true,
    });

    await app.register(cors, {
        origin: true,
        credentials: true,
    });

    await app.register(fastifyJwt, {
        secret: env.JWT_SECRET,
    });

    app.decorate("authenticate", authenticate);

    app.get("/", async () => {
        return {
            success: true,
            message: "Expense Tracker API",
        };
    });

    await registerRoutes(app);

    return app;
}