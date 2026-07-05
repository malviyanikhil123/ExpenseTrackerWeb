import { env } from "../config/env";
import postgres from "postgres";

export const client = postgres({
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});