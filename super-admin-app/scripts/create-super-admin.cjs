/**
 * Create Super Admin Account
 * Email: eduexplo@gmail.com
 * Password: Ni btana
 *
 * Usage: node scripts/create-super-admin.js
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
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@eduplexo.com";
const DEFAULT_ADMIN_PASS = process.env.DEFAULT_ADMIN_PASS || "Admin@123";
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// User Schema (matching shared/models/user.model.ts)
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

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

async function createSuperAdmin() {
  try {
    console.log("\n🔧 Super Admin Account Creator\n");
    console.log(`📦 MongoDB: ${MONGODB_URI}`);
    console.log(`📧 Email:   ${DEFAULT_ADMIN_EMAIL}`);
    console.log("Connecting to database...");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    // Check if user already exists
    const existing = await UserModel.findOne({ email: DEFAULT_ADMIN_EMAIL });

    if (existing) {
      console.log("⚠️  User already exists. Updating...");
      existing.role = "super_admin";
      existing.permissions = ["*"];
      existing.status = "active";
      existing.school_id = "PLATFORM";
      existing.password_hash = hashPassword(DEFAULT_ADMIN_PASS);
      existing.profile = {
        first_name: "Super",
        last_name: "Admin",
      };
      await existing.save();
      console.log("✅ Account updated to Super Admin\n");
    } else {
      console.log("Creating new Super Admin account...");
      await UserModel.create({
        email: DEFAULT_ADMIN_EMAIL,
        password_hash: hashPassword(DEFAULT_ADMIN_PASS),
        role: "super_admin",
        permissions: ["*"],
        profile: {
          first_name: "Super",
          last_name: "Admin",
        },
        status: "active",
        school_id: "PLATFORM",
      });
      console.log("✅ Super Admin account created\n");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 SUPER ADMIN ACCOUNT READY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email:    ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${DEFAULT_ADMIN_PASS}`);
    console.log(`🌐 URL:      http://localhost:3001/login`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

createSuperAdmin();
