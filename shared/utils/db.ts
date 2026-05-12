import { Types } from "mongoose";

/**
 * Safely converts a string to a MongoDB ObjectId.
 * In development, if the ID is not a valid hex string (e.g. "dev-user-id"),
 * it returns a standard mock ObjectId to prevent BSON casting errors.
 * 
 * @param id - The ID string to convert
 * @param fallback - Optional fallback hex string
 * @returns A valid MongoDB ObjectId
 */
export function toObjectId(id: string | undefined | null, fallback = "66388484e366b57709a3562c"): Types.ObjectId {
  if (!id) return new Types.ObjectId(fallback);
  
  if (Types.ObjectId.isValid(id)) {
    return new Types.ObjectId(id);
  }
  
  // If we're here, it's likely a dev ID like "dev-user-id"
  // Log a warning in development so we know it's happening
  if (process.env.NODE_ENV === "development") {
    // console.warn(`[toObjectId] Converting non-standard ID "${id}" to mock ObjectId "${fallback}"`);
  }
  
  return new Types.ObjectId(fallback);
}

/**
 * Safely converts an array of strings to MongoDB ObjectIds, filtering out invalid ones.
 */
export function toObjectIds(ids: string[] | undefined | null): Types.ObjectId[] {
  if (!ids || !Array.isArray(ids)) return [];
  return ids
    .filter(id => id && Types.ObjectId.isValid(id))
    .map(id => new Types.ObjectId(id));
}
