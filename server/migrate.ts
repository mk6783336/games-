import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabase } from "./db";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "migrations");

export async function runMigrations() {
  // Neon provides a pooled and a direct connection string. Migrations must run on
  // the direct (unpooled) one: PgBouncer transaction mode breaks DDL and session
  // state ("prepared statement already exists", relations that "do not exist").
  const direct = process.env.DATABASE_URL_UNPOOLED?.trim();
  if (direct) process.env.DATABASE_URL = direct;

  const db = await getDatabase();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const existing = await db.query<{ name: string }>(
      "SELECT name FROM schema_migrations WHERE name = $1",
      [file],
    );
    if (existing.rows.length) continue;

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await db.exec(sql);
    await db.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    console.log(`[db] applied ${file}`);
  }

  return { database: db.label, migrations: files.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(async (result) => {
      console.log(`[db] ready on ${result.database} (${result.migrations} migrations)`);
      const { closeDatabase } = await import("./db");
      await closeDatabase();
    })
    .catch((error) => {
      console.error("[db] migration failed", error);
      process.exitCode = 1;
    });
}
