import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");

// Load .env file without overriding existing environment variables set by Docker Compose or host system
dotenv.config({ path: envPath, override: false });

export { envPath };
