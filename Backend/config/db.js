/**
 * db.js
 *
 * Central MySQL Database Layer for Traveloop V2.
 * Powered by mysql2/promise with connection pooling, parameterized queries,
 * transactions, master data seeding, and a fluent query builder.
 */

import "./env.js";
import crypto from "crypto";
import mysqlPool, { query, execute, transaction, testConnection, closePool } from "./mysql.js";

/**
 * Fluent Query Builder for MySQL
 * Provides parameterized, safe SQL generation for CRUD operations.
 */
class MySQLQueryBuilder {
  constructor(table) {
    this.table = table;
    this.operation = "SELECT";
    this.selectColumns = "*";
    this.insertData = null;
    this.updateData = null;
    this.whereClauses = [];
    this.params = [];
    this.orderBy = [];
    this.limitCount = null;
    this.offsetCount = null;
  }

  select(columns = "*") {
    this.operation = "SELECT";
    this.selectColumns = columns;
    return this;
  }

  insert(payload) {
    this.operation = "INSERT";
    this.insertData = payload;
    return this;
  }

  update(payload) {
    this.operation = "UPDATE";
    this.updateData = payload;
    return this;
  }

  delete() {
    this.operation = "DELETE";
    return this;
  }

  eq(column, value) {
    if (value === null || value === undefined) {
      this.whereClauses.push(`\`${column}\` IS NULL`);
    } else {
      this.whereClauses.push(`\`${column}\` = ?`);
      this.params.push(value);
    }
    return this;
  }

  neq(column, value) {
    if (value === null || value === undefined) {
      this.whereClauses.push(`\`${column}\` IS NOT NULL`);
    } else {
      this.whereClauses.push(`\`${column}\` != ?`);
      this.params.push(value);
    }
    return this;
  }

  in(column, values) {
    if (!values || values.length === 0) {
      this.whereClauses.push("1=0");
      return this;
    }
    const placeholders = values.map(() => "?").join(", ");
    this.whereClauses.push(`\`${column}\` IN (${placeholders})`);
    this.params.push(...values);
    return this;
  }

  ilike(column, pattern) {
    this.whereClauses.push(`LOWER(\`${column}\`) LIKE LOWER(?)`);
    this.params.push(pattern);
    return this;
  }

  like(column, pattern) {
    this.whereClauses.push(`\`${column}\` LIKE ?`);
    this.params.push(pattern);
    return this;
  }

  gte(column, value) {
    this.whereClauses.push(`\`${column}\` >= ?`);
    this.params.push(value);
    return this;
  }

  lte(column, value) {
    this.whereClauses.push(`\`${column}\` <= ?`);
    this.params.push(value);
    return this;
  }

  gt(column, value) {
    this.whereClauses.push(`\`${column}\` > ?`);
    this.params.push(value);
    return this;
  }

  lt(column, value) {
    this.whereClauses.push(`\`${column}\` < ?`);
    this.params.push(value);
    return this;
  }

  or(orConditionString) {
    if (!orConditionString || typeof orConditionString !== "string") return this;
    const parts = orConditionString.split(",").map((p) => p.trim());
    const subClauses = [];

    for (const part of parts) {
      const match = part.match(/^([^.]+)\.(eq|neq|is)\.(.+)$/);
      if (match) {
        const col = match[1];
        const op = match[2];
        const val = match[3];
        if (op === "eq") {
          subClauses.push(`\`${col}\` = ?`);
          this.params.push(val);
        } else if (op === "neq") {
          subClauses.push(`\`${col}\` != ?`);
          this.params.push(val);
        }
      } else {
        // Direct field match
        const directEq = part.match(/^([^=]+)=(.+)$/);
        if (directEq) {
          subClauses.push(`\`${directEq[1].trim()}\` = ?`);
          this.params.push(directEq[2].trim());
        }
      }
    }

    if (subClauses.length > 0) {
      this.whereClauses.push(`(${subClauses.join(" OR ")})`);
    }
    return this;
  }

  order(column, { ascending = true } = {}) {
    const dir = ascending ? "ASC" : "DESC";
    this.orderBy.push(`\`${column}\` ${dir}`);
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  offset(count) {
    this.offsetCount = count;
    return this;
  }

  async executeQuery() {
    try {
      if (this.operation === "SELECT") {
        let sql = `SELECT ${this.selectColumns === "*" ? "*" : this.selectColumns} FROM \`${this.table}\``;
        if (this.whereClauses.length > 0) {
          sql += ` WHERE ${this.whereClauses.join(" AND ")}`;
        }
        if (this.orderBy.length > 0) {
          sql += ` ORDER BY ${this.orderBy.join(", ")}`;
        }
        if (this.limitCount !== null) {
          sql += ` LIMIT ${Number(this.limitCount)}`;
        }
        if (this.offsetCount !== null) {
          sql += ` OFFSET ${Number(this.offsetCount)}`;
        }

        const rows = await query(sql, this.params);
        return { data: rows || [], error: null };
      }

      if (this.operation === "INSERT") {
        const records = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        if (records.length === 0) return { data: [], error: null };

        const insertedRecords = [];

        for (const record of records) {
          const item = { ...record };
          if (!item.id) {
            item.id = crypto.randomUUID();
          }

          const keys = Object.keys(item);
          const cols = keys.map((k) => `\`${k}\``).join(", ");
          const placeholders = keys.map(() => "?").join(", ");
          const vals = keys.map((k) => {
            const v = item[k];
            if (v !== null && typeof v === "object" && !(v instanceof Date)) {
              return JSON.stringify(v);
            }
            return v;
          });

          const sql = `INSERT INTO \`${this.table}\` (${cols}) VALUES (${placeholders})`;
          await query(sql, vals);
          insertedRecords.push(item);
        }

        const resultData = Array.isArray(this.insertData) ? insertedRecords : insertedRecords[0];
        return { data: resultData, error: null };
      }

      if (this.operation === "UPDATE") {
        if (!this.updateData || Object.keys(this.updateData).length === 0) {
          return { data: null, error: null };
        }

        const keys = Object.keys(this.updateData);
        const setClauses = keys.map((k) => `\`${k}\` = ?`).join(", ");
        const updateVals = keys.map((k) => {
          const v = this.updateData[k];
          if (v !== null && typeof v === "object" && !(v instanceof Date)) {
            return JSON.stringify(v);
          }
          return v;
        });

        let sql = `UPDATE \`${this.table}\` SET ${setClauses}`;
        if (this.whereClauses.length > 0) {
          sql += ` WHERE ${this.whereClauses.join(" AND ")}`;
        }

        await query(sql, [...updateVals, ...this.params]);

        // If updated with unique where condition, retrieve updated row
        if (this.whereClauses.length > 0) {
          let selectSql = `SELECT * FROM \`${this.table}\` WHERE ${this.whereClauses.join(" AND ")} LIMIT 1`;
          const rows = await query(selectSql, this.params);
          return { data: rows && rows.length > 0 ? rows[0] : null, error: null };
        }

        return { data: this.updateData, error: null };
      }

      if (this.operation === "DELETE") {
        let sql = `DELETE FROM \`${this.table}\``;
        if (this.whereClauses.length > 0) {
          sql += ` WHERE ${this.whereClauses.join(" AND ")}`;
        }
        await query(sql, this.params);
        return { data: null, error: null };
      }

      return { data: null, error: new Error(`Unsupported operation: ${this.operation}`) };
    } catch (err) {
      console.error(`[MySQL Query Error on ${this.table}]:`, err.message);
      return { data: null, error: err };
    }
  }

  // Promise resolution support so "await db.from(...)" works seamlessly
  then(resolve, reject) {
    return this.executeQuery().then(resolve, reject);
  }

  async single() {
    this.limit(1);
    const { data, error } = await this.executeQuery();
    if (error) return { data: null, error };
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { data: null, error: new Error("Row not found") };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return { data: row, error: null };
  }

  async maybeSingle() {
    this.limit(1);
    const { data, error } = await this.executeQuery();
    if (error) return { data: null, error };
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { data: null, error: null };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return { data: row, error: null };
  }
}

/**
 * Main Database Interface
 */
export const db = {
  from: (table) => new MySQLQueryBuilder(table),
  query,
  execute,
  transaction,
  getPool: mysqlPool.getPool,
};

/**
 * Smart Client Resolver
 */
export const getDbClient = async () => db;

/**
 * Initialize MySQL Connectivity and Seed Master Reference Tables
 */
export const connectDB = async () => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.warn("[MySQL] Warning: Initial connection ping failed. Will retry on request.");
      return db;
    }

    // Seed master lookup tables if empty
    const seedIfEmpty = async (table, items) => {
      try {
        const rows = await query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
        const count = rows && rows[0]?.cnt ? Number(rows[0].cnt) : 0;
        if (count === 0) {
          for (const name of items) {
            await query(`INSERT INTO \`${table}\` (id, name) VALUES (?, ?)`, [
              crypto.randomUUID(),
              name,
            ]);
          }
          console.log(`Seeded default values for MySQL table: ${table}`);
        }
      } catch (err) {
        console.warn(`[Seed Warning] Failed to seed ${table}:`, err.message);
      }
    };

    await seedIfEmpty("bus_types", [
      "AC Sleeper",
      "Semi Sleeper",
      "Volvo",
      "Mini Bus",
      "Tempo Traveller",
    ]);

    await seedIfEmpty("bus_amenities", [
      "WiFi",
      "Charging",
      "Blanket",
      "Water Bottle",
      "Recliner Seats",
      "TV",
      "Snacks",
      "USB Port",
      "Reading Light",
    ]);

    await seedIfEmpty("hotel_amenities", [
      "Swimming Pool",
      "WiFi",
      "Gym",
      "Breakfast",
      "Parking",
      "Spa",
      "Jacuzzi",
      "Kids Zone",
      "Conference Hall",
      "Private Beach",
      "Pool Bar",
    ]);

    await seedIfEmpty("trip_activities", [
      "Beach Visit",
      "Cruise",
      "Temple Visit",
      "Shopping",
      "Safari",
      "Campfire",
      "Adventure Sports",
      "Trekking",
      "Boating",
      "Museum",
      "Night Party",
      "Scuba Diving",
      "ATV Ride",
      "Zipline",
      "Kayaking",
    ]);

    return db;
  } catch (error) {
    console.error(`❌ MySQL Database Connection Error: ${error.message}`);
    return db;
  }
};

export default db;
