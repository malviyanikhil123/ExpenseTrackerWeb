import { defineConfig } from "drizzle-kit";
import "dotenv/config";

import { env } from "./src/config/env";

export default defineConfig({
    out: "./drizzle/migrations",
    schema: "./src/db/schema/*",
    dialect: "postgresql",

    dbCredentials: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        database: env.DB_DATABASE,
    },
});