import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eduplexo";

async function main() {
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);

    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log("\n--- Current Database Status ---");
    for (const col of collections) {
        const count = await mongoose.connection.collection(col.name).countDocuments();
        console.log(`${col.name}: ${count} documents`);
    }
    console.log("-------------------------------\n");

    await mongoose.disconnect();
}

main().catch(console.error);
