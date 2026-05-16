-- Migration: 000011_optional_screenshot.up.sql
-- Purpose: Make screenshot_url optional in payment_requests.

ALTER TABLE payment_requests ALTER COLUMN screenshot_url DROP NOT NULL;
