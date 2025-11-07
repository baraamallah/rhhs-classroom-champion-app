import { Pool, type QueryResult, type QueryResultRow } from "pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn("⚠️  DATABASE_URL is not set. Some features may not work.")
  console.warn("📖 See GET_DATABASE_CONNECTION.md for instructions on how to get your connection string.")
}

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined
}

const pool = connectionString
  ? global.pgPool ||
    new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: connectionString.includes("localhost") 
        ? false 
        : {
            rejectUnauthorized: false,
          },
    })
  : null

if (process.env.NODE_ENV !== "production" && pool) {
  global.pgPool = pool
}

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  if (!pool) {
    throw new Error(
      "DATABASE_URL is not configured. Please add DATABASE_URL to your .env.local file. " +
      "See GET_DATABASE_CONNECTION.md for instructions."
    )
  }
  
  const client = await pool.connect()

  try {
    return await client.query<T>(text, params)
  } finally {
    client.release()
  }
}
