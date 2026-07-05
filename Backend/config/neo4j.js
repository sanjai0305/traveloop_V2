import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "password";

let driver;

try {
  console.log(`[Neo4j Init] Connecting to Neo4j instance at: ${uri}`);
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 100,
    connectionTimeout: 30000, // 30s
  });
} catch (error) {
  console.error("[Neo4j Init] Failed to create driver instance:", error);
}

export const getSession = (options = {}) => {
  if (!driver) {
    throw new Error("Neo4j driver is not initialized.");
  }
  return driver.session(options);
};

export const checkNeo4jConnection = async () => {
  if (!driver) return false;
  try {
    const serverInfo = await driver.getServerInfo();
    console.log("[Neo4j Health] Connection verified. Server info:", serverInfo.address);
    return true;
  } catch (error) {
    console.error("[Neo4j Health] Verification failed:", error.message);
    return false;
  }
};

export const closeNeo4jDriver = async () => {
  if (driver) {
    await driver.close();
    console.log("[Neo4j] Connection pool closed.");
  }
};

export default {
  getSession,
  checkNeo4jConnection,
  closeNeo4jDriver,
  driver,
};
