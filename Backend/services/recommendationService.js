import { getSession } from "../config/neo4j.js";

// Helper to run query read transactions safely
const runReadQuery = async (cypher, params = {}) => {
  const session = getSession();
  try {
    const result = await session.executeRead(tx => tx.run(cypher, params));
    return result.records.map(record => {
      const keys = record.keys;
      const row = {};
      keys.forEach(k => {
        const val = record.get(k);
        row[k] = val && typeof val.toInt === "function" ? val.toInt() : val;
      });
      return row;
    });
  } catch (error) {
    console.error("[Neo4j Recommendation Error] Service query failed:", error.message);
    return [];
  } finally {
    await session.close();
  }
};

/** Get personalized recommendations based on interests, social circles, and liked destinations */
export const getPersonalizedRecommendations = async (userId) => {
  const query = `
    MATCH (u:User {id: $userId})
    // Path A: Friend recommendations
    OPTIONAL MATCH (u)-[:FOLLOWS|FRIEND_OF]-(f:User)-[:BOOKED]->(t1:Trip)
    WHERE NOT (u)-[:BOOKED]->(t1)
    
    // Path B: Interest/Destination Similarity recommendation
    OPTIONAL MATCH (u)-[:LIKES]->(d1:Destination)-[s:SIMILAR_TO]-(d2:Destination)<-[:VISITS]-(t2:Trip)
    WHERE NOT (u)-[:BOOKED]->(t2) AND s.score > 0.65
    
    WITH coalesce(t1, t2) AS trip, 
         sum(case when t1 IS NOT NULL then 2.0 else 0.0 end) + 
         sum(case when t2 IS NOT NULL then 1.5 else 0.0 end) AS recommendationScore
    WHERE trip IS NOT NULL
    RETURN trip.id AS tripId, recommendationScore
    ORDER BY recommendationScore DESC
    LIMIT 10
  `;
  return runReadQuery(query, { userId: userId.toString() });
};

/** Get trip-based collaborative filtering recommendations ("People who booked this also booked...") */
export const getTripBasedRecommendations = async (tripId) => {
  const query = `
    MATCH (t1:Trip {id: $tripId})<-[:BOOKED]-(u:User)-[:BOOKED]->(t2:Trip)
    WHERE t1 <> t2
    RETURN t2.id AS tripId, COUNT(u) AS score
    ORDER BY score DESC
    LIMIT 5
  `;
  return runReadQuery(query, { tripId: tripId.toString() });
};

/** Get destination similarity recommendations */
export const getDestinationBasedRecommendations = async (destId) => {
  const query = `
    MATCH (d1:Destination {id: $destId})-[r:SIMILAR_TO]-(d2:Destination)
    OPTIONAL MATCH (t:Trip)-[:VISITS]->(d2)
    WHERE t IS NOT NULL
    RETURN t.id AS tripId, d2.name AS destinationName, r.score AS similarityScore
    ORDER BY similarityScore DESC
    LIMIT 5
  `;
  return runReadQuery(query, { destId: destId.toString() });
};

export default {
  getPersonalizedRecommendations,
  getTripBasedRecommendations,
  getDestinationBasedRecommendations,
};
