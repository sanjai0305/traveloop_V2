/**
 * supabaseAdmin.js (Deprecated - Bridges to MySQL)
 *
 * This file is retained as an internal compatibility bridge during
 * the complete MySQL migration. All operations route directly to MySQL.
 */

import { db } from "./db.js";

export const supabaseAdmin = db;
export default db;
