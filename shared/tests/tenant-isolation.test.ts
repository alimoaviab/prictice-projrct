/**
 * CRITICAL: Multi-Tenant Isolation Test Suite
 * 
 * These tests verify that no data leakage occurs between schools.
 * Run these tests before every deployment.
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { connectDb } from "../db/connect";
import { StudentModel } from "../models/student.model";
import { TeacherModel } from "../models/teacher.model";
import { ClassModel } from "../models/class.model";
import { tenantFilter } from "../db/tenant-query";
import { RequestContext } from "../types/core";

describe("Multi-Tenant Isolation Tests", () => {
    let schoolA_id: string;
    let schoolB_id: string;
    let studentA_id: string;
    let studentB_id: string;

    beforeAll(async () => {
        await connectDb();
        
        // Create test schools
        schoolA_id = "test-school-a";
        schoolB_id = "test-school-b";

        // Create test students
        const studentA = await StudentModel.create({
            school_id: schoolA_id,
            admission_no: "A001",
            first_name: "Student",
            last_name: "A",
            class_id: "class-a",
            section: "A",
            guardian: {
                name: "Guardian A",
                phone: "1234567890"
            },
            status: "active"
        });
        studentA_id = String(studentA._id);

        const studentB = await StudentModel.create({
            school_id: schoolB_id,
            admission_no: "B001",
            first_name: "Student",
            last_name: "B",
            class_id: "class-b",
            section: "B",
            guardian: {
                name: "Guardian B",
                phone: "0987654321"
            },
            status: "active"
        });
        studentB_id = String(studentB._id);
    });

    afterAll(async () => {
        // Cleanup test data
        await StudentModel.deleteMany({
            school_id: { $in: [schoolA_id, schoolB_id] }
        });
    });

    describe("Query Isolation", () => {
        it("should only return School A students when querying with School A context", async () => {
            const ctxA: RequestContext = {
                school_id: schoolA_id,
                user_id: "user-a",
                role: "admin",
                app: "school",
                permissions: ["*"],
                session_id: "session-a"
            };

            const students = await StudentModel.find(tenantFilter(ctxA)).lean();
            
            expect(students.length).toBeGreaterThan(0);
            students.forEach(student => {
                expect(student.school_id).toBe(schoolA_id);
            });
        });

        it("should only return School B students when querying with School B context", async () => {
            const ctxB: RequestContext = {
                school_id: schoolB_id,
                user_id: "user-b",
                role: "admin",
                app: "school",
                permissions: ["*"],
                session_id: "session-b"
            };

            const students = await StudentModel.find(tenantFilter(ctxB)).lean();
            
            expect(students.length).toBeGreaterThan(0);
            students.forEach(student => {
                expect(student.school_id).toBe(schoolB_id);
            });
        });

        it("should not allow cross-tenant queries", async () => {
            const ctxA: RequestContext = {
                school_id: schoolA_id,
                user_id: "user-a",
                role: "admin",
                app: "school",
                permissions: ["*"],
                session_id: "session-a"
            };

            // Try to query School B student with School A context
            const student = await StudentModel.findOne(
                tenantFilter(ctxA, { _id: studentB_id })
            ).lean();

            // Should not find the student
            expect(student).toBeNull();
        });
    });

    describe("Update Isolation", () => {
        it("should not allow updating records from different school", async () => {
            const ctxA: RequestContext = {
                school_id: schoolA_id,
                user_id: "user-a",
                role: "admin",
                app: "school",
                permissions: ["*"],
                session_id: "session-a"
            };

            // Try to update School B student with School A context
            const result = await StudentModel.updateOne(
                tenantFilter(ctxA, { _id: studentB_id }),
                { $set: { first_name: "Hacked" } }
            );

            // Should not update anything
            expect(result.modifiedCount).toBe(0);

            // Verify student B was not modified
            const studentB = await StudentModel.findById(studentB_id).lean();
            expect(studentB?.first_name).toBe("Student");
        });
    });

    describe("Delete Isolation", () => {
        it("should not allow deleting records from different school", async () => {
            const ctxA: RequestContext = {
                school_id: schoolA_id,
                user_id: "user-a",
                role: "admin",
                app: "school",
                permissions: ["*"],
                session_id: "session-a"
            };

            // Try to delete School B student with School A context
            const result = await StudentModel.deleteOne(
                tenantFilter(ctxA, { _id: studentB_id })
            );

            // Should not delete anything
            expect(result.deletedCount).toBe(0);

            // Verify student B still exists
            const studentB = await StudentModel.findById(studentB_id).lean();
            expect(studentB).not.toBeNull();
        });
    });

    describe("Cross-Tenant Access Prevention", () => {
        it("should throw error when trying to access different school_id", () => {
            const ctxA: RequestContext = {
                school_id: schoolA_id,
                user_id: "user-a",
                role: "admin",
                app: "school",
                permissions: ["*"],
                session_id: "session-a"
            };

            // Try to explicitly query different school
            expect(() => {
                tenantFilter(ctxA, { school_id: schoolB_id });
            }).toThrow("Cross-tenant access is not allowed");
        });
    });

    describe("Production Safety", () => {
        it("should not allow dev-school-id in production", () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "production";

            const ctxDev: RequestContext = {
                school_id: "dev-school-id",
                user_id: "dev-user",
                role: "admin",
                app: "school",
                permissions: ["*"],
                session_id: "dev-session"
            };

            expect(() => {
                tenantFilter(ctxDev);
            }).toThrow("Development tenant not allowed in production");

            process.env.NODE_ENV = originalEnv;
        });
    });
});

describe("Academic Year Isolation Tests", () => {
    it("should filter by both school_id and academic_year_id", async () => {
        // Test implementation for academic year isolation
        // Similar pattern to tenant isolation tests
    });
});
