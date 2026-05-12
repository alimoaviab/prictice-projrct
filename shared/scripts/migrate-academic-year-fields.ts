/**
 * CRITICAL DATABASE MIGRATION SCRIPT
 * 
 * This script adds academic_year_id to existing records that don't have it.
 * It assigns the active academic year to all records without an academic_year_id.
 * 
 * IMPORTANT: Run this script ONCE after deploying the academic year isolation changes.
 * 
 * Usage:
 *   npx ts-node shared/scripts/migrate-academic-year-fields.ts
 */

import { connectDb } from "../db/connect";
import { AcademicYearModel } from "../models/academic-year.model";
import { AttendanceModel } from "../models/attendance.model";
import { ExamModel } from "../models/exam.model";
import { ResultModel } from "../models/result.model";
import { HomeworkModel } from "../models/homework.model";
import { TimetableModel } from "../models/timetable.model";
import { FeeModel } from "../models/fee.model";

interface MigrationStats {
  collection: string;
  updated: number;
  skipped: number;
  errors: number;
}

async function migrateCollection(
  Model: any,
  collectionName: string,
  schoolId: string,
  academicYearId: string
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    collection: collectionName,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Find records without academic_year_id
    const recordsToUpdate = await Model.find({
      school_id: schoolId,
      academic_year_id: { $exists: false }
    }).lean();

    console.log(`[${collectionName}] Found ${recordsToUpdate.length} records to migrate`);

    for (const record of recordsToUpdate) {
      try {
        await Model.updateOne(
          { _id: record._id },
          { $set: { academic_year_id: academicYearId } }
        );
        stats.updated++;
      } catch (error) {
        console.error(`[${collectionName}] Error updating record ${record._id}:`, error);
        stats.errors++;
      }
    }

    // Count records that already have academic_year_id
    const existingCount = await Model.countDocuments({
      school_id: schoolId,
      academic_year_id: { $exists: true }
    });
    stats.skipped = existingCount;

    console.log(`[${collectionName}] Migration complete:`, stats);
  } catch (error) {
    console.error(`[${collectionName}] Migration failed:`, error);
    stats.errors++;
  }

  return stats;
}

async function migrateSchool(schoolId: string): Promise<void> {
  console.log(`\n=== Migrating school: ${schoolId} ===`);

  // Get active academic year for this school
  const activeAcademicYear = await AcademicYearModel.findOne({
    school_id: schoolId,
    is_active: true
  }).lean() as any;

  if (!activeAcademicYear) {
    console.warn(`⚠️  No active academic year found for school ${schoolId}. Skipping.`);
    return;
  }

  const academicYear = activeAcademicYear as { _id: string; year: string };
  const academicYearId = String(academicYear._id);
  console.log(`Using academic year: ${academicYear.year} (${academicYearId})`);

  // Migrate each collection
  const collections = [
    { Model: AttendanceModel, name: "attendance" },
    { Model: ExamModel, name: "exams" },
    { Model: ResultModel, name: "results" },
    { Model: HomeworkModel, name: "homework" },
    { Model: TimetableModel, name: "timetable" },
    { Model: FeeModel, name: "fees" }
  ];

  const allStats: MigrationStats[] = [];

  for (const { Model, name } of collections) {
    const stats = await migrateCollection(Model, name, schoolId, academicYearId);
    allStats.push(stats);
  }

  // Print summary
  console.log(`\n=== Migration Summary for ${schoolId} ===`);
  console.table(allStats);

  const totalUpdated = allStats.reduce((sum, s) => sum + s.updated, 0);
  const totalErrors = allStats.reduce((sum, s) => sum + s.errors, 0);

  if (totalErrors > 0) {
    console.error(`❌ Migration completed with ${totalErrors} errors`);
  } else {
    console.log(`✅ Migration successful! Updated ${totalUpdated} records`);
  }
}

async function main() {
  try {
    console.log("🚀 Starting academic year field migration...\n");

    await connectDb();

    // Get all schools
    const { SchoolModel } = await import("../models/school.model");
    const schools = await SchoolModel.find({ status: "active" })
      .select("_id school_id name")
      .lean();

    console.log(`Found ${schools.length} active schools to migrate\n`);

    // Migrate each school
    for (const school of schools) {
      await migrateSchool(school.school_id);
    }

    console.log("\n✅ All migrations complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration if executed directly
if (require.main === module) {
  main();
}

export { migrateSchool, migrateCollection };
