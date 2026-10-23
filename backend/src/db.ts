import pg from "pg";
import 'dotenv/config';

export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 60000,
});

pool.query('SELECT 1').catch((err) => console.error('DB warm-up failed', err));