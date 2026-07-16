import { Pool, PoolClient } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

const isProd = process.env.NODE_ENV === "production";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}
const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,

    ...(isProd && {
      ssl: {
        rejectUnauthorized: true,
      },
    }),
    // ssl: false, // Disable SSL for local development
    // Performance tuning
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 5000,
  });

if (!isProd) {
  global._pgPool = pool;
}

export async function query(text: string, params?: unknown[]) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error("⛔ Database query error:", err);
    console.error("SQL:", text);
    throw err;
  }
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("⛔ Transaction Error:", err);
    throw err;
  } finally {
    client.release();
  }
}

export { pool };
