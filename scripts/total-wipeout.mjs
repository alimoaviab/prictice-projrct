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

    console.log("Dropping the entire database...");
    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped successfully.");

    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error("Wipeout failed:", error);
    process.exit(1);
});
