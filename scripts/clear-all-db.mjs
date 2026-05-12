import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eduplexo";

async function main() {
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections. Clearing all data...`);

    for (const collection of collections) {
        const collectionName = collection.name;
        if (collectionName.startsWith("system.")) continue; // Skip system collections

        try {
            const result = await mongoose.connection.collection(collectionName).deleteMany({});
            console.log(`Cleared ${result.deletedCount} documents from ${collectionName}`);
        } catch (error) {
            console.error(`Failed to clear ${collectionName}:`, error.message);
        }
    }

    console.log("Database cleared successfully.");
    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error("Clear failed:", error);
    try {
        await mongoose.disconnect();
    } catch {
        // ignore
    }
    process.exit(1);
});
