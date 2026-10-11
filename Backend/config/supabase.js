/**
 * supabase.js (Deprecated - Bridges to MySQL)
 *
 * This file is retained as an internal compatibility bridge during
 * the complete MySQL migration. All operations route directly to MySQL.
 */

import { db, getDbClient } from "./db.js";

export { db, getDbClient };
export const supabase = db;
export default db;
