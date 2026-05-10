import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eduplexo";
const SCHOOL_ID = process.env.SCHOOL_ID || "default-school";

async function main() {
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);

    const collections = [
        "academic_years",
        "subjects",
        "classes",
        "teachers",
        "users",
        "students",
        "timetable",
        "attendance",
        "results",
        "homework",
        "exams"
    ];

    console.log(`Clearing data for school: ${SCHOOL_ID}`);

    for (const collectionName of collections) {
        try {
            const result = await mongoose.connection.collection(collectionName).deleteMany({ school_id: SCHOOL_ID });
            console.log(`Cleared ${result.deletedCount} documents from ${collectionName}`);
        } catch (error) {
            console.error(`Failed to clear ${collectionName}:`, error.message);
        }
    }

    console.log("Data clear complete.");
    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error("Clear failed:", error);
    try {
        await mongoose.disconnect();
    } catch {
        // ignore
    }
    process.exit(1);
});
