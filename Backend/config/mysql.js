/**
 * mysql.js
 *
 * Centralized MySQL connection pool module using mysql2/promise.
 * Provides connection pooling, parameterized query execution,
 * transactions, health checks, and graceful shutdown.
 */

import "./env.js";
import fs from "node:fs";
import mysql from "mysql2/promise";

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = parseInt(process.env.DB_PORT || "3306", 10);
const dbName = process.env.DB_NAME || "traveloop";
const dbUser = process.env.DB_USER || "traveloop_app";
const dbPassword = process.env.DB_PASSWORD || "";
const dbSsl = process.env.DB_SSL === "true"
  ? {
      ca: fs.readFileSync(
        process.env.DB_SSL_CA_PATH || "/home/ubuntu/global-bundle.pem",
        "utf8",
      ),
      rejectUnauthorized: true,
    }
  : undefined;

let pool = null;

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
      ssl: dbSsl,
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_POOL_LIMIT || "15", 10),
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      dateStrings: true,
      namedPlaceholders: false,
    });

    console.log(`[MySQL Config] Pool configured for ${dbUser}@${dbHost}:${dbPort}/${dbName}`);
  }
  return pool;
};

/**
 * Execute parameterized SQL query
 */
export const query = async (sql, params = []) => {
  const p = getPool();
  const [rows, fields] = await p.query(sql, params);
  return rows;
};

/**
 * Execute parameterized SQL statement (prepared statement)
 */
export const execute = async (sql, params = []) => {
  const p = getPool();
  const [result, fields] = await p.execute(sql, params);
  return result;
};

/**
 * Get dedicated connection from pool (e.g., for multi-step transaction)
 */
export const getConnection = async () => {
  const p = getPool();
  return await p.getConnection();
};

/**
 * Transaction helper: automatically commits or rolls back
 */
export const transaction = async (callback) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Verify active connectivity
 */
export const testConnection = async () => {
  try {
    const p = getPool();
    const [rows] = await p.query("SELECT 1 AS connected");
    if (rows && rows[0]?.connected === 1) {
      console.log(`✅ MySQL Database Connected successfully [${dbName} on ${dbHost}:${dbPort}]`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`❌ MySQL Connection Error [${dbHost}:${dbPort}/${dbName}]:`, err.message);
    return false;
  }
};

/**
 * Close pool gracefully on application shutdown
 */
export const closePool = async () => {
  if (pool) {
    console.log("[MySQL] Closing connection pool...");
    await pool.end();
    pool = null;
    console.log("[MySQL] Pool closed.");
  }
};

export default {
  getPool,
  query,
  execute,
  getConnection,
  transaction,
  testConnection,
  closePool,
};
