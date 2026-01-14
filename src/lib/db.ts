import { Pool, PoolClient } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

const isProd = process.env.NODE_ENV === "production";

// Decode CA cert if available
const caCert =
  isProd && process.env.RDS_CA_BUNDLE
    ? Buffer.from(process.env.RDS_CA_BUNDLE, "base64").toString("utf8")
    : undefined;

// Create or reuse pool
const pool =
  global._pgPool ??
  new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,

    ...(isProd && {
      ssl: {
        ca: caCert,
        rejectUnauthorized: true,
      },
    }),

    // Performance tuning
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 5000,
  });

// assign to global to prevent multiple pools in dev
if (!isProd) global._pgPool = pool;

// Wrapper query function with logging
export async function query(text: string, params?: unknown[]) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error("⛔ Database query error:", err);
    console.error("SQL:", text);
    throw err;
  }
}

// Transaction wrapper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
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
