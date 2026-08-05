import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");

// Load .env file with override: true to ensure .env settings supersede any empty/stale environment keys set by parent runners
dotenv.config({ path: envPath, override: true });

export { envPath };
