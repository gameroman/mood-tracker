import config from "../../config.json" assert { type: "json" };

export const db = new Bun.SQL({
  adapter: "postgres",
  username: config.database.user,
  password: config.database.password,
  database: config.database.database,
});

export async function exec$(query: string, values: unknown[] = []): Promise<any[]> {
  return (await db.unsafe(query, values)).rows;
}

export async function fetch$(query: string, values: unknown[] = []) {
  return (await exec$(query, values))[0];
}

export async function initDatabase() {
  await db.file("data/setup.psql");
}
