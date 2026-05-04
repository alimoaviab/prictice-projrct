import { UserModel } from "../models/user.model";
import { hashPassword } from "../auth/password";
import { connectDb } from "./connect";

export async function seedDefaultAdmin(schoolId: string = "default-school") {
  await connectDb();

  const adminEmail = "admin@school.com";
  const existing = await UserModel.findOne({ school_id: schoolId, email: adminEmail });

  if (existing) {
    console.log("Default admin already exists for school:", schoolId);
    return;
  }

  const passwordHash = hashPassword("admin123");

  await UserModel.create({
    school_id: schoolId,
    email: adminEmail,
    password_hash: passwordHash,
    role: "admin",
    profile: {
      first_name: "Default",
      last_name: "Admin"
    },
    status: "active"
  });

  console.log("Default admin created successfully for school:", schoolId);
}
