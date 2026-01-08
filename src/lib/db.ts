import { Pool, PoolClient } from "pg";
declare global {
  var _pgPool: Pool | undefined;
}

const isProd = process.env.NODE_ENV === "production";

// Decode CA only if exists
const caCert =
  isProd && process.env.RDS_CA_BUNDLE
    ? Buffer.from(process.env.RDS_CA_BUNDLE, "base64").toString("utf8")
    : undefined;
     const pool =
         global._pgPool ||
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

    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

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
    throw err;
  } finally {
    client.release();
  }
}

export { pool };
