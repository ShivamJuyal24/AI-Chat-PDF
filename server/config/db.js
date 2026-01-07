import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // 👈 ENSURE ENV IS LOADED HERE

const { Pool } = pkg;

export const db = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD), // 👈 FORCE STRING
  database: process.env.DB_NAME,
  ssl: false,
});
