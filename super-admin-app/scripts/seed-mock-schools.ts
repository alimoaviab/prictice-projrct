import { connectDb } from "../../shared/db/connect";
import { SchoolModel } from "../../shared/models/school.model";
import { randomUUID } from "node:crypto";

async function seedSchools() {
    try {
        console.log("Connecting to database...");
        await connectDb();

        // 1. Migrate existing schools
        console.log("Migrating existing schools to 'approved' status...");
        await SchoolModel.updateMany(
            { status: { $in: ["active", "blocked", null] } },
            { $set: { status: "approved" } }
        );

        // 2. Seed Mock Schools
        const mockSchools = [
            {
                school_id: "SCH-KHI-001",
                name: "The City School (South Campus)",
                code: "CITY001",
                status: "approved",
                admin_profile: { name: "Ahmed Khan", email: "ahmed@cityschool.com", phone: "0300-1234567" },
                plan: { key: "enterprise" },
                usage: { students: 1250, teachers: 85, classes: 42 }
            },
            {
                school_id: "SCH-LHR-002",
                name: "Beaconhouse Garden Town",
                code: "BSS002",
                status: "pending",
                admin_profile: { name: "Saira Ali", email: "saira@beaconhouse.edu.pk", phone: "0321-9876543" },
                plan: { key: "premium" },
                usage: { students: 850, teachers: 60, classes: 30 }
            },
            {
                school_id: "SCH-ISB-003",
                name: "Roots Millennium School",
                code: "RMS003",
                status: "suspended",
                admin_profile: { name: "Faisal Qureshi", email: "faisal@roots.com", phone: "0312-5556667" },
                plan: { key: "basic" },
                usage: { students: 400, teachers: 25, classes: 15 }
            },
            {
                school_id: "SCH-KHI-004",
                name: "Froebel's International",
                code: "FIS004",
                status: "approved",
                admin_profile: { name: "Zainab Shah", email: "zainab@froebels.com", phone: "0333-1112223" },
                plan: { key: "enterprise" },
                usage: { students: 2100, teachers: 120, classes: 55 }
            },
            {
                school_id: "SCH-FSD-005",
                name: "Army Public School",
                code: "APS005",
                status: "pending",
                admin_profile: { name: "Col. Usman", email: "usman@aps.edu.pk", phone: "0345-4443332" },
                plan: { key: "free" },
                usage: { students: 3000, teachers: 150, classes: 80 }
            }
        ];

        for (const school of mockSchools) {
            const exists = await SchoolModel.findOne({ school_id: school.school_id });
            if (!exists) {
                console.log(`Creating mock school: ${school.name}`);
                await SchoolModel.create(school);
            }
        }

        console.log("Schools seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seedSchools();
