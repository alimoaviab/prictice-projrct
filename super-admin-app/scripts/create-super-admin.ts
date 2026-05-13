/**
 * Create Super Admin Account
 * Email: eduexplo@gmail.com
 * Password: Ni btana
 */

import { connectDb } from "../../shared/db/connect";
import { UserModel } from "../../shared/models/user.model";
import { hashPassword } from "../../shared/auth/password";

async function createSuperAdmin() {
  try {
    console.log("\n🔧 Super Admin Account Creator\n");
    console.log("Connecting to MongoDB...");
    await connectDb();
    console.log("✅ Connected\n");

    const email = "eduexplo@gmail.com";
    const password = "Ni btana";

    // Check if user already exists
    const existing = await UserModel.findOne({ email });

    if (existing) {
      console.log("⚠️  User already exists. Updating to super_admin...");
      existing.role = "super_admin";
      existing.permissions = ["*"];
      existing.status = "active";
      existing.school_id = "PLATFORM";
      existing.password_hash = hashPassword(password);
      await existing.save();
      console.log("✅ User updated to Super Admin\n");
    } else {
      console.log("Creating new Super Admin account...");
      await UserModel.create({
        email,
        password_hash: hashPassword(password),
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
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🌐 URL:      http://localhost:3001/login`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error creating super admin:", error.message);
    console.error(error);
    process.exit(1);
  }
}

createSuperAdmin();
