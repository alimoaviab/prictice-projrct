/**
 * Create School Admin Account
 * Usage: node scripts/create-school-admin.cjs
 */

const mongoose = require("mongoose");
const crypto = require("crypto");
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

// Password hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// Schemas
const schoolSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "approved",
    },
    admin_profile: {
      name: String,
      email: String,
      phone: String,
    },
    plan: {
      key: { type: String, default: "free" },
      seats: { type: Number, default: 100 },
      expires_at: Date,
    },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "schools" }
);

const userSchema = new mongoose.Schema(
  {
    school_id: { type: String, required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "teacher", "parent", "student"],
      required: true,
      index: true,
    },
    permissions: [{ type: String, trim: true }],
    profile: {
      first_name: String,
      last_name: String,
      phone: String,
      avatar_url: String,
    },
    status: {
      type: String,
      enum: ["active", "invited", "disabled", "locked"],
      default: "active",
      index: true,
    },
    last_login_at: Date,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "users",
  }
);

userSchema.index({ school_id: 1, email: 1 }, { unique: true });

const SchoolModel = mongoose.models.School || mongoose.model("School", schoolSchema);
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

async function createSchoolAdmin() {
  try {
    console.log("\n🏫 School Admin Account Creator\n");
    console.log(`📦 MongoDB: ${MONGODB_URI}`);
    console.log("Connecting to database...");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    const schoolId = "SCHOOL_001";
    const adminEmail = "school@gmail.com";
    const adminPassword = "Test@123";

    // Create or update school
    let school = await SchoolModel.findOne({ school_id: schoolId });
    if (!school) {
      console.log("Creating school...");
      school = await SchoolModel.create({
        school_id: schoolId,
        name: "Demo School",
        code: "DEMO",
        status: "approved",
        admin_profile: {
          name: "School Admin",
          email: adminEmail,
          phone: "+92-300-0000000",
        },
        plan: {
          key: "premium",
          seats: 500,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      console.log("✅ School created\n");
    } else {
      console.log("✅ School already exists\n");
    }

    // Create or update admin user
    let user = await UserModel.findOne({ email: adminEmail });
    if (user) {
      console.log("⚠️  Admin user already exists. Updating...");
      user.role = "admin";
      user.permissions = ["*"];
      user.status = "active";
      user.school_id = schoolId;
      user.password_hash = hashPassword(adminPassword);
      user.profile = {
        first_name: "School",
        last_name: "Admin",
      };
      await user.save();
      console.log("✅ Admin user updated\n");
    } else {
      console.log("Creating admin user...");
      await UserModel.create({
        school_id: schoolId,
        email: adminEmail,
        password_hash: hashPassword(adminPassword),
        role: "admin",
        permissions: ["*"],
        profile: {
          first_name: "School",
          last_name: "Admin",
        },
        status: "active",
      });
      console.log("✅ Admin user created\n");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 SCHOOL ADMIN ACCOUNT READY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🏫 School:   ${school.name}`);
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`🌐 URL:      http://localhost:3000/auth/login`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

createSchoolAdmin();
