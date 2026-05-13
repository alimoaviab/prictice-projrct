import mongoose from "mongoose";
import crypto from "node:crypto";

const MONGODB_URI = "mongodb+srv://abdul:asdfasdf@cluster0.p5exv3z.mongodb.net/?appName=Cluster0";

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

async function approve() {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    const email = "school@gmail.com";
    const password = "Test@123";
    
    // 1. Update School Status
    const schoolUpdate = await db.collection("schools").updateOne(
        { "admin_profile.email": email },
        { 
            $set: { 
                status: "approved",
                approved_at: new Date(),
                approved_by: "system_admin"
            } 
        }
    );
    console.log("School update result:", schoolUpdate);
    
    // 2. Update User Password and Status
    const userUpdate = await db.collection("users").updateOne(
        { email: email },
        { 
            $set: { 
                status: "active",
                password_hash: hashPassword(password)
            } 
        }
    );
    console.log("User update result:", userUpdate);
    
    await mongoose.disconnect();
}

approve().catch(console.error);
