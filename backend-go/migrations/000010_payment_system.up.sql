-- Migration: 000010_payment_system
-- Purpose: Super Admin payment verification system with configurable payment methods.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. subscription_plans — Admin-managed plan catalog
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS subscription_plans (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    student_limit   INT NOT NULL DEFAULT 200,
    price           INT NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'PKR',
    duration_days   INT NOT NULL DEFAULT 30,
    features        JSONB NOT NULL DEFAULT '[]',
    is_custom       BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    display_order   INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed default plans
INSERT INTO subscription_plans (id, name, student_limit, price, duration_days, features, is_custom, display_order) VALUES
('plan_starter', 'Starter School', 200, 4000, 30, '["Student & Staff Directory","Basic Attendance Tracking","Fee Collection","Parent Portal App","Standard Support"]', false, 1),
('plan_growth', 'Growth Plan', 500, 8000, 30, '["Everything in Starter","Advanced Reporting","SMS Notifications","Analytics Dashboard","Priority Support"]', false, 2),
('plan_custom', 'Custom Plan', 800, 0, 30, '["Everything in Growth","Dedicated Support","Enterprise Features","Custom Integrations","Custom Student Limit"]', true, 3)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. payment_methods — Super Admin configurable payment accounts
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payment_methods (
    id              TEXT PRIMARY KEY,
    method_type     TEXT NOT NULL,          -- jazzcash | easypaisa | bank
    method_name     TEXT NOT NULL,          -- Display name
    account_title   TEXT NOT NULL,
    account_number  TEXT NOT NULL,
    iban            TEXT,
    bank_name       TEXT,
    branch_name     TEXT,
    instructions    TEXT,
    qr_image_url    TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    display_order   INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. payment_requests — School payment submissions awaiting verification
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payment_requests (
    id                TEXT PRIMARY KEY,
    school_id         TEXT NOT NULL,
    plan_id           TEXT NOT NULL,
    payment_method_id TEXT,
    screenshot_url    TEXT NOT NULL,
    transaction_id    TEXT NOT NULL,
    amount            INT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'pending',  -- pending | verified | rejected
    submitted_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    verified_at       TIMESTAMP,
    verified_by       TEXT,
    rejection_reason  TEXT,
    notes             TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_requests_school_idx ON payment_requests (school_id, status);
CREATE INDEX IF NOT EXISTS payment_requests_status_idx ON payment_requests (status, submitted_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS payment_requests_txn_uniq ON payment_requests (transaction_id) WHERE status != 'rejected';
