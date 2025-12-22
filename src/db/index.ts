import config from "#config" assert { type: "json" };

import { drizzle } from "drizzle-orm/bun-sql";

import * as schema from "./schema";

const client = new Bun.SQL({
  adapter: "postgres",
  username: config.database.user,
  password: config.database.password,
  database: config.database.database,
});

export const db = drizzle({ client, schema });

export type User = typeof schema.users.$inferSelect;

export async function exec$(query: string, values: unknown[] = []): Promise<any[]> {
  return (await client.unsafe(query, values)).rows;
}

export async function fetch$(query: string, values: unknown[] = []) {
  return (await exec$(query, values))[0];
}

export async function initDatabase() {
  await client.file("data/setup.psql");
}
