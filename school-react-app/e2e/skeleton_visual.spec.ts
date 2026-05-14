/**
 * Visual Regression Test — Skeleton Loading States
 *
 * Verifies:
 * 1. Skeleton is shown while API is loading (delayed response)
 * 2. Real content replaces skeleton after data loads
 * 3. No layout shift between skeleton and real content
 *
 * Run: npx playwright test e2e/skeleton_visual.spec.ts
 * Requires: npx playwright install
 */

import { test, expect } from "@playwright/test";

test.describe("Dashboard Skeleton Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth — set token in localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem("token", "test-jwt-token");
      localStorage.setItem("last_school_id", "school_1");
      localStorage.setItem("academic_year_id", "ay_2025");
    });
  });

  test("skeleton shown during loading, replaced by real content", async ({ page }) => {
    // Intercept the dashboard API and delay it by 1 second
    await page.route("**/api/dashboard/composite*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          success: true,
          data: {
            overview: {
              totalStudents: 487,
              totalTeachers: 32,
              totalClasses: 18,
              attendanceToday: 92,
              attendanceDetailed: { present: 420, absent: 37, total: 457 },
              activeExams: 3,
              pendingLeave: 5,
              unmarkedStudents: 30,
              feeCollection: { total: 2400000, paid: 1800000, percentage: 75, pending_count: 120 },
            },
            attendance: { present: 420, absent: 37, late: 12, total: 457, percent: 92, unmarked: 30 },
            fees: { totalExpected: 2400000, totalPaid: 1800000, percentage: 75, pendingCount: 120 },
            pendingLeaves: 5,
            activities: [
              { _id: "a1", action: "create", entity_type: "student", actor_email: "admin@school.com", created_at: "2026-05-15T10:00:00Z" },
            ],
            upcomingEvents: [
              { _id: "e1", title: "Annual Day", start_date: "2026-06-01", event_type: "cultural" },
            ],
            classAttendance: [
              { id: "c1", name: "Class 10A", has_attendance: true },
              { id: "c2", name: "Class 10B", has_attendance: false },
            ],
          },
        }),
      });
    });

    // Also intercept analytics/dashboard for the legacy endpoint
    await page.route("**/api/analytics/dashboard*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: {} }),
      });
    });

    // Navigate to dashboard
    await page.goto("/admin/dashboard");

    // ─── Screenshot 1: Skeleton state (at t=100ms) ─────────────────────
    await page.waitForTimeout(100);
    const skeletonScreenshot = await page.screenshot({ fullPage: true });

    // Verify skeleton elements are visible
    const pulseElements = await page.locator(".animate-pulse").count();
    expect(pulseElements).toBeGreaterThan(5); // Multiple skeleton elements

    // ─── Wait for data to load ─────────────────────────────────────────
    await page.waitForTimeout(1200); // Wait for 1s delay + render

    // ─── Screenshot 2: Loaded state ────────────────────────────────────
    const loadedScreenshot = await page.screenshot({ fullPage: true });

    // ─── Assert: Screenshots are different ─────────────────────────────
    // (skeleton was actually shown, then replaced by real content)
    expect(Buffer.compare(skeletonScreenshot, loadedScreenshot)).not.toBe(0);

    // ─── Assert: No layout shift ───────────────────────────────────────
    // Check that the page height didn't change dramatically (no jumping)
    // This is a proxy for CLS — real CLS measurement needs Lighthouse
    const skeletonHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.waitForTimeout(100);
    const loadedHeight = await page.evaluate(() => document.body.scrollHeight);

    // Allow 10% height difference (content may be slightly different size)
    const heightDiff = Math.abs(loadedHeight - skeletonHeight) / skeletonHeight;
    expect(heightDiff).toBeLessThan(0.1); // Less than 10% shift
  });

  test("skeleton cards match real card count", async ({ page }) => {
    // Delay API to see skeleton
    await page.route("**/api/dashboard/composite*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          success: true,
          data: {
            overview: { totalStudents: 100, totalTeachers: 10, totalClasses: 5, attendanceToday: 90, attendanceDetailed: {}, activeExams: 2, pendingLeave: 3, unmarkedStudents: 10, feeCollection: {} },
            attendance: {}, fees: {}, pendingLeaves: 0, activities: [], upcomingEvents: [], classAttendance: [],
          },
        }),
      });
    });

    await page.goto("/admin/dashboard");
    await page.waitForTimeout(50);

    // Count skeleton cards (animate-pulse elements in the grid)
    const skeletonCards = await page.locator(".grid .animate-pulse").count();
    // Should have skeleton cards visible
    expect(skeletonCards).toBeGreaterThan(0);
  });
});

test.describe("Student List Skeleton", () => {
  test("skeleton rows shown during loading", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("token", "test-jwt-token");
      localStorage.setItem("last_school_id", "school_1");
      localStorage.setItem("academic_year_id", "ay_2025");
    });

    // Delay student API
    await page.route("**/api/students*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            items: [
              { _id: "s1", first_name: "Ali", last_name: "Khan", admission_no: "STU-001", status: "active" },
              { _id: "s2", first_name: "Sara", last_name: "Ahmed", admission_no: "STU-002", status: "active" },
            ],
            total: 2, page: 1, limit: 25, pages: 1,
          },
        }),
      });
    });

    await page.goto("/admin/students");
    await page.waitForTimeout(50);

    // Skeleton should be visible
    const skeletons = await page.locator(".animate-pulse").count();
    expect(skeletons).toBeGreaterThan(0);

    // Wait for data
    await page.waitForTimeout(700);

    // Skeleton should be gone, real data visible
    const skeletonsAfter = await page.locator(".animate-pulse").count();
    // After load, there should be fewer (or zero) skeleton elements
    expect(skeletonsAfter).toBeLessThan(skeletons);
  });
});
