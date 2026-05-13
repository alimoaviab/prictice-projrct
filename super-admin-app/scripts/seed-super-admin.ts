import { connectDb } from "../../shared/db/connect";
import { UserModel } from "../../shared/models/user.model";
import { hashPassword } from "../../shared/auth/password";
import mongoose from "mongoose";

async function seedSuperAdmin() {
    try {
        console.log("Connecting to database...");
        await connectDb();

        const email = "eduexplo@gmail.com";
        const password = "Ni btana"; // Using the string provided by user

        const existing = await UserModel.findOne({ email });
        if (existing) {
            console.log("Super Admin already exists. Updating role...");
            existing.role = "super_admin";
            existing.permissions = ["*"];
            await existing.save();
        } else {
            console.log("Creating new Super Admin...");
            await UserModel.create({
                email,
                password_hash: hashPassword(password),
                role: "super_admin",
                permissions: ["*"],
                profile: {
                    first_name: "Super",
                    last_name: "Admin"
                },
                status: "active",
                school_id: "PLATFORM" // Global platform ID
            });
        }

        console.log("Super Admin seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seedSuperAdmin();
