/**
 * Approve School from Super Admin
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

const schoolSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "suspended"], default: "approved" },
    admin_profile: { name: String, email: String, phone: String },
    plan: { key: { type: String, default: "premium" }, seats: { type: Number, default: 500 } },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "schools" }
);

const SchoolModel = mongoose.models.School || mongoose.model("School", schoolSchema);

async function approveSchool() {
  try {
    console.log("\n✅ Approving School...\n");
    console.log(`📦 MongoDB: ${MONGODB_URI}`);
    console.log("Connecting to database...");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    const result = await SchoolModel.updateOne(
      { school_id: "SCHOOL_001" },
      { 
        $set: { 
          status: "approved",
          approved_by: "super_admin",
          approved_at: new Date()
        } 
      }
    );

    if (result.modifiedCount > 0) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🎉 SCHOOL APPROVED!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🏫 School ID: SCHOOL_001`);
      console.log(`📧 Admin Email: school@gmail.com`);
      console.log(`🔑 Password: Test@123`);
      console.log(`✅ Status: APPROVED`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    } else {
      console.log("⚠️  School not found or already approved\n");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

approveSchool();
