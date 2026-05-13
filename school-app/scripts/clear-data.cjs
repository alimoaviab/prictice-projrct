/**
 * Clear all demo data from MongoDB
 */

const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load .env.local
const envPath = path.join(__dirname, "../../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/eduplexo";

async function clearData() {
  try {
    console.log("\n🗑️  Clearing all demo data...\n");
    console.log(`📦 MongoDB: ${MONGODB_URI}`);
    console.log("Connecting to database...");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    const collections = [
      "schools",
      "classes",
      "students",
      "teachers",
      "attendance",
      "homework",
      "exams",
      "results",
      "fees",
      "users",
    ];

    for (const collection of collections) {
      const result = await mongoose.connection.collection(collection).deleteMany({});
      console.log(`✓ Cleared ${collection}: ${result.deletedCount} documents`);
    }

    console.log("\n✅ All data cleared!\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

clearData();
