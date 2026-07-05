import { getSession } from "../config/neo4j.js";

// Helper to run dynamic read/write transactions safely
const runWriteQuery = async (cypher, params = {}) => {
  const session = getSession();
  try {
    const result = await session.executeWrite(tx => tx.run(cypher, params));
    return result.records;
  } catch (error) {
    console.error(`[Neo4j Repository Error] Query: ${cypher.slice(0, 100)}... Reason:`, error.message);
    throw error;
  } finally {
    await session.close();
  }
};

// ─── ENTITY MERGERS ──────────────────────────────────────────────────────────

export const mergeUserNode = async (userId, properties = {}) => {
  const query = `
    MERGE (u:User {id: $id})
    ON CREATE SET u += $properties, u.createdAt = timestamp()
    ON MATCH SET u += $properties, u.updatedAt = timestamp()
    RETURN u
  `;
  return runWriteQuery(query, { id: userId.toString(), properties });
};

export const mergeAgentNode = async (agentId, properties = {}) => {
  const query = `
    MERGE (a:Agent {id: $id})
    ON CREATE SET a += $properties, a.createdAt = timestamp()
    ON MATCH SET a += $properties, a.updatedAt = timestamp()
    RETURN a
  `;
  return runWriteQuery(query, { id: agentId.toString(), properties });
};

export const mergeTripNode = async (tripId, properties = {}) => {
  const query = `
    MERGE (t:Trip {id: $id})
    ON CREATE SET t += $properties, t.createdAt = timestamp()
    ON MATCH SET t += $properties, t.updatedAt = timestamp()
    RETURN t
  `;
  return runWriteQuery(query, { id: tripId.toString(), properties });
};

export const mergeDestinationNode = async (destId, properties = {}) => {
  const query = `
    MERGE (d:Destination {id: $id})
    ON CREATE SET d += $properties, d.createdAt = timestamp()
    ON MATCH SET d += $properties, d.updatedAt = timestamp()
    RETURN d
  `;
  return runWriteQuery(query, { id: destId.toString(), properties });
};

export const mergeHotelNode = async (hotelId, properties = {}) => {
  const query = `
    MERGE (h:Hotel {id: $id})
    ON CREATE SET h += $properties, h.createdAt = timestamp()
    ON MATCH SET h += $properties, h.updatedAt = timestamp()
    RETURN h
  `;
  return runWriteQuery(query, { id: hotelId.toString(), properties });
};

export const mergeVehicleNode = async (vehicleId, properties = {}) => {
  const query = `
    MERGE (v:Vehicle {id: $id})
    ON CREATE SET v += $properties, v.createdAt = timestamp()
    ON MATCH SET v += $properties, v.updatedAt = timestamp()
    RETURN v
  `;
  return runWriteQuery(query, { id: vehicleId.toString(), properties });
};

// ─── RELATIONSHIP BUILDERS ───────────────────────────────────────────────────

export const createBookedRelation = async (userId, tripId, bookingDetails = {}) => {
  const query = `
    MATCH (u:User {id: $userId})
    MATCH (t:Trip {id: $tripId})
    MERGE (u)-[r:BOOKED]->(t)
    ON CREATE SET r += $bookingDetails, r.createdAt = timestamp()
    ON MATCH SET r += $bookingDetails, r.updatedAt = timestamp()
    RETURN r
  `;
  return runWriteQuery(query, {
    userId: userId.toString(),
    tripId: tripId.toString(),
    bookingDetails,
  });
};

export const createLikesRelation = async (userId, destId, score = 1.0) => {
  const query = `
    MATCH (u:User {id: $userId})
    MATCH (d:Destination {id: $destId})
    MERGE (u)-[r:LIKES]->(d)
    SET r.weight = $score, r.updatedAt = timestamp()
    RETURN r
  `;
  return runWriteQuery(query, { userId: userId.toString(), destId: destId.toString(), score });
};

export const createVisitedRelation = async (userId, destId) => {
  const query = `
    MATCH (u:User {id: $userId})
    MATCH (d:Destination {id: $destId})
    MERGE (u)-[r:VISITED]->(d)
    SET r.updatedAt = timestamp()
    RETURN r
  `;
  return runWriteQuery(query, { userId: userId.toString(), destId: destId.toString() });
};

export const createFollowsRelation = async (userId, agentId) => {
  const query = `
    MATCH (u:User {id: $userId})
    MATCH (a:Agent {id: $agentId})
    MERGE (u)-[r:FOLLOWS]->(a)
    SET r.updatedAt = timestamp()
    RETURN r
  `;
  return runWriteQuery(query, { userId: userId.toString(), agentId: agentId.toString() });
};

export const createCreatedRelation = async (agentId, tripId) => {
  const query = `
    MATCH (a:Agent {id: $agentId})
    MATCH (t:Trip {id: $tripId})
    MERGE (a)-[r:CREATED]->(t)
    SET r.updatedAt = timestamp()
    RETURN r
  `;
  return runWriteQuery(query, { agentId: agentId.toString(), tripId: tripId.toString() });
};

export const createVisitsRelation = async (tripId, destId, day = 1) => {
  const query = `
    MATCH (t:Trip {id: $tripId})
    MATCH (d:Destination {id: $destId})
    MERGE (t)-[r:VISITS]->(d)
    SET r.day = $day, r.updatedAt = timestamp()
    RETURN r
  `;
  return runWriteQuery(query, { tripId: tripId.toString(), destId: destId.toString(), day });
};

export const createSimilarToRelation = async (destId1, destId2, score = 0.5) => {
  const query = `
    MATCH (d1:Destination {id: $destId1})
    MATCH (d2:Destination {id: $destId2})
    MERGE (d1)-[r:SIMILAR_TO]->(d2)
    SET r.score = $score, r.updatedAt = timestamp()
    RETURN r
  `;
  return runWriteQuery(query, { destId1: destId1.toString(), destId2: destId2.toString(), score });
};

export const createRecommendedRelation = async (userId, tripId) => {
  const query = `
    MATCH (u:User {id: $userId})
    MATCH (t:Trip {id: $tripId})
    MERGE (u)-[r:RECOMMENDED]->(t)
    SET r.updatedAt = timestamp()
    RETURN r
  `;
  return runWriteQuery(query, { userId: userId.toString(), tripId: tripId.toString() });
};

export const createStaysAtRelation = async (tripId, hotelId) => {
  const query = `
    MATCH (t:Trip {id: $tripId})
    MATCH (h:Hotel {id: $hotelId})
    MERGE (t)-[r:STAYS_AT]->(h)
    SET r.updatedAt = timestamp()
    RETURN r
  `;
  return runWriteQuery(query, { tripId: tripId.toString(), hotelId: hotelId.toString() });
};

export const deleteEntityRelations = async (label, entityId) => {
  const query = `
    MATCH (n:${label} {id: $entityId})
    DETACH DELETE n
  `;
  return runWriteQuery(query, { entityId: entityId.toString() });
};
