import mongoose from "mongoose";

// HARDCODED FALLBACK FOR DEV
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://abdul:asdfasdf@cluster0.p5exv3z.mongodb.net/?appName=Cluster0";

async function main() {
    console.log("⚠️  WARNING: This will delete ALL data from the database.");
    console.log(`Connecting to: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections. Starting deletion...`);

    for (const col of collections) {
        const collectionName = col.name;
        
        // Skip system collections
        if (collectionName.startsWith("system.")) continue;

        try {
            const result = await db.collection(collectionName).deleteMany({});
            console.log(`✅ Cleared ${result.deletedCount} documents from [${collectionName}]`);
        } catch (error) {
            console.error(`❌ Failed to clear ${collectionName}:`, error.message);
        }
    }

    console.log("\n✨ Database is now completely empty.");
    await mongoose.disconnect();
    process.exit(0);
}

main().catch(async (error) => {
    console.error("Reset failed:", error);
    try {
        await mongoose.disconnect();
    } catch {
        // ignore
    }
    process.exit(1);
});
