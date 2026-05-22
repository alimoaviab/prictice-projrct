-- Certificate Templates
CREATE TABLE IF NOT EXISTS certificate_templates (
    id              TEXT PRIMARY KEY,
    school_id       TEXT NOT NULL,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL DEFAULT 'character',
    orientation     TEXT NOT NULL DEFAULT 'landscape',
    background_url  TEXT DEFAULT '',
    watermark_url   TEXT DEFAULT '',
    border_style    TEXT DEFAULT '',
    body_text       TEXT DEFAULT '',
    elements        TEXT DEFAULT '[]',
    is_default      BOOLEAN DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_templates_school ON certificate_templates(school_id);

-- Generated Certificates
CREATE TABLE IF NOT EXISTS generated_certificates (
    id                TEXT PRIMARY KEY,
    school_id         TEXT NOT NULL,
    template_id       TEXT NOT NULL,
    student_id        TEXT NOT NULL,
    student_name      TEXT NOT NULL,
    class_name        TEXT DEFAULT '',
    certificate_type  TEXT NOT NULL,
    certificate_no    TEXT NOT NULL,
    verification_code TEXT NOT NULL UNIQUE,
    qr_code_url       TEXT DEFAULT '',
    pdf_url           TEXT DEFAULT '',
    issue_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date       TIMESTAMPTZ,
    status            TEXT NOT NULL DEFAULT 'issued',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_certs_school ON generated_certificates(school_id);
CREATE INDEX IF NOT EXISTS idx_gen_certs_student ON generated_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_gen_certs_verify ON generated_certificates(verification_code);
