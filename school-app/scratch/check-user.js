import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://abdul:asdfasdf@cluster0.p5exv3z.mongodb.net/?appName=Cluster0";

async function check() {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    const school = await db.collection("schools").findOne({ "admin_profile.email": "school@gmail.com" });
    console.log("School found:", JSON.stringify(school, null, 2));
    
    const user = await db.collection("users").findOne({ email: "school@gmail.com" });
    console.log("User found:", JSON.stringify(user, null, 2));
    
    await mongoose.disconnect();
}

check().catch(console.error);
