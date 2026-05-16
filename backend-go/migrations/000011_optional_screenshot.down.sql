-- Migration: 000011_optional_screenshot.down.sql
ALTER TABLE payment_requests ALTER COLUMN screenshot_url SET NOT NULL;
