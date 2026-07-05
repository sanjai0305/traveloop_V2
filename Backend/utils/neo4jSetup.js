import fs from "fs";
import path from "path";
import { getSession } from "../config/neo4j.js";

export const runConstraintsSetup = async () => {
  const session = getSession();
  try {
    console.log("[Neo4j Setup] Running graph database schema migrations...");
    const filePath = path.resolve("data/constraints.cypher");
    
    if (!fs.existsSync(filePath)) {
      console.warn(`[Neo4j Setup] Cypher constraints file not found at: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const queries = content
      .split(";")
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith("//"));

    for (const query of queries) {
      console.log(`[Neo4j Setup] Executing: ${query.replace(/\s+/g, " ")}`);
      await session.run(query);
    }
    console.log("[Neo4j Setup] Unique constraints and indices created successfully.");
  } catch (error) {
    console.error("[Neo4j Setup] FAILED to verify or execute database constraints:", error.message);
  } finally {
    await session.close();
  }
};

export default runConstraintsSetup;
