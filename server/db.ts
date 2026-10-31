import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface Database {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
  exec(text: string): Promise<void>;
  close(): Promise<void>;
  label: string;
}

class PGliteDatabase implements Database {
  label = "pglite (local Postgres)";
  private client: PGlite;

  constructor(dir: string) {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    this.client = new PGlite(dir);
  }

  async query<T>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const result = await this.client.query<T>(text, params);
    return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
  }

  async exec(text: string) {
    await this.client.exec(text);
  }

  async close() {
    await this.client.close();
  }
}

class PgDatabase implements Database {
  label = "postgres";
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({
      connectionString,
      max: 8,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  async query<T>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const result = await this.pool.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? result.rows.length };
  }

  async exec(text: string) {
    await this.pool.query(text);
  }

  async close() {
    await this.pool.end();
  }
}

let database: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (database) return database;
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    database = new PgDatabase(url);
  } else {
    const dir = path.resolve(process.env.PGLITE_DIR ?? ".data/pglite");
    database = new PGliteDatabase(dir);
  }
  return database;
}

export async function closeDatabase() {
  if (!database) return;
  await database.close();
  database = null;
}
