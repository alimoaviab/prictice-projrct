-- Migration: 000009_subscriptions
-- Purpose: Subscription & billing system for multi-tenant school SaaS.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. subscriptions — active subscription per school
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS subscriptions (
    id              TEXT PRIMARY KEY,
    school_id       TEXT NOT NULL,
    plan_name       TEXT NOT NULL DEFAULT 'starter',  -- starter | growth | custom
    student_limit   INT NOT NULL DEFAULT 200,
    price           INT NOT NULL DEFAULT 0,           -- PKR amount per month
    currency        TEXT NOT NULL DEFAULT 'PKR',
    start_date      TIMESTAMP NOT NULL DEFAULT NOW(),
    end_date        TIMESTAMP NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active',   -- active | expired | cancelled | trial
    is_trial        BOOLEAN NOT NULL DEFAULT false,
    trial_used      BOOLEAN NOT NULL DEFAULT false,
    trial_start_date TIMESTAMP,
    trial_end_date  TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_school_active_uniq
ON subscriptions (school_id) WHERE status IN ('active', 'trial');

CREATE INDEX IF NOT EXISTS subscriptions_school_idx
ON subscriptions (school_id, status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. subscription_history — audit trail of all subscription changes
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS subscription_history (
    id              TEXT PRIMARY KEY,
    school_id       TEXT NOT NULL,
    plan_name       TEXT NOT NULL,
    student_limit   INT NOT NULL DEFAULT 200,
    amount          INT NOT NULL DEFAULT 0,
    payment_status  TEXT NOT NULL DEFAULT 'pending',  -- pending | paid | failed
    start_date      TIMESTAMP NOT NULL,
    end_date        TIMESTAMP NOT NULL,
    action          TEXT NOT NULL DEFAULT 'subscribe', -- subscribe | upgrade | renew | trial | cancel
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_history_school_idx
ON subscription_history (school_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Seed default subscription for existing schools (starter trial)
-- ═══════════════════════════════════════════════════════════════════════════
-- Existing schools get a starter plan with generous limit so they aren't blocked
INSERT INTO subscriptions (id, school_id, plan_name, student_limit, price, start_date, end_date, status, is_trial, trial_used)
SELECT 
    'sub_' || school_id,
    school_id,
    'growth',
    500,
    0,
    NOW(),
    NOW() + INTERVAL '1 year',
    'active',
    false,
    false
FROM schools
WHERE school_id NOT IN (SELECT school_id FROM subscriptions)
ON CONFLICT DO NOTHING;
