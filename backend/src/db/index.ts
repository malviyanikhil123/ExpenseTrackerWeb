import { drizzle } from "drizzle-orm/postgres-js";

import { client } from "./client";

export const db = drizzle(client);