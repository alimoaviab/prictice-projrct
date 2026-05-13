/**
 * Centralized error message formatter.
 *
 * Translates raw backend errors (MongoDB driver errors, JWT errors,
 * Zod validation errors, network errors, etc.) into clear,
 * user-friendly messages that follow the pattern:
 *
 *   what happened — why it happened — what the user should do
 *
 * The mapping is conservative: any error code or shape we don't
 * recognize is passed through unchanged so the original message
 * still surfaces, but with safe formatting.
 */

const MONGO_DUPLICATE_FIELD_HINTS: Record<string, string> = {
    email: "An account with this email is already registered.",
    admission_no: "A student with this admission number already exists.",
    employee_no: "A teacher with this employee number already exists.",
    invoice_no: "This invoice number is already in use.",
    receipt_no: "This receipt number is already in use.",
    school_id: "This school code is already in use.",
    code: "This code is already in use.",
    name: "An entry with this name already exists.",
    year: "This academic year is already configured."
};

function readDuplicateFieldHint(rawMessage: string): string | undefined {
    // Mongo duplicate-key errors look like:
    //   E11000 duplicate key error collection: db.coll index: email_1 dup key: { email: "x@y.com" }
    const indexMatch = /index:\s*([a-zA-Z0-9_.]+?)_\d/.exec(rawMessage);
    if (indexMatch && indexMatch[1]) {
        const field = indexMatch[1].split(".").pop() ?? indexMatch[1];
        const hint = MONGO_DUPLICATE_FIELD_HINTS[field];
        if (hint) return hint;
    }

    const dupKeyMatch = /dup key:\s*\{\s*([a-zA-Z0-9_]+):/i.exec(rawMessage);
    if (dupKeyMatch && dupKeyMatch[1]) {
        const field = dupKeyMatch[1];
        const hint = MONGO_DUPLICATE_FIELD_HINTS[field];
        if (hint) return hint;
    }

    return undefined;
}

/**
 * Format any thrown value into a clean, user-friendly string.
 * Preserves the original message when it's already user-friendly.
 */
export function formatErrorMessage(error: unknown, fallback = "Something didn't work as expected. Please try again."): string {
    if (!error) return fallback;

    if (typeof error === "string") return cleanupMessage(error) || fallback;

    const err = error as Record<string, any>;
    const rawMessage = String(err.message ?? "");
    const code = String(err.code ?? err.errorCode ?? "");
    const name = String(err.name ?? "");

    // Mongo duplicate-key
    if (code === "11000" || rawMessage.includes("E11000") || rawMessage.includes("duplicate key")) {
        const hint = readDuplicateFieldHint(rawMessage);
        return hint ?? "This value is already in use. Please choose a different one.";
    }

    // Mongoose validation
    if (name === "ValidationError" && err.errors) {
        const first = Object.values(err.errors)[0] as any;
        if (first?.message) return cleanupMessage(String(first.message));
    }

    // Mongoose cast errors (bad ObjectId etc)
    if (name === "CastError") {
        const path = err.path || "field";
        return `The supplied ${path} is not in the expected format.`;
    }

    // Zod
    if (name === "ZodError" || Array.isArray(err.issues)) {
        const firstIssue = err.issues?.[0];
        if (firstIssue?.message) {
            const fieldPath = Array.isArray(firstIssue.path) ? firstIssue.path.join(".") : "";
            const prefix = fieldPath ? `${humanizeFieldName(fieldPath)}: ` : "";
            return `${prefix}${cleanupMessage(String(firstIssue.message))}`;
        }
    }

    // JWT errors
    if (name === "JsonWebTokenError" || rawMessage.includes("JWT")) {
        return "Your session is invalid. Please log in again.";
    }
    if (name === "TokenExpiredError" || rawMessage.toLowerCase().includes("token has expired")) {
        return "Your session has expired. Please log in again.";
    }

    // Network / fetch
    if (name === "TypeError" && rawMessage.toLowerCase().includes("fetch")) {
        return "Unable to connect to the server. Check your internet connection and try again.";
    }
    if (name === "AbortError") {
        return "The request was cancelled.";
    }

    // Permission / auth
    if (code === "FORBIDDEN" || err.status === 403) {
        return rawMessage && rawMessage !== "Forbidden"
            ? cleanupMessage(rawMessage)
            : "You don't have permission to do this. Please contact your administrator.";
    }
    if (code === "UNAUTHORIZED" || err.status === 401) {
        return "You need to log in again to continue.";
    }
    if (err.status === 404 || code === "NOT_FOUND") {
        return rawMessage && rawMessage.length > 0
            ? cleanupMessage(rawMessage)
            : "The requested item could not be found.";
    }
    if (err.status === 409 || code === "CONFLICT") {
        return cleanupMessage(rawMessage) || "This action conflicts with existing data.";
    }
    if (err.status === 429) {
        return "You're doing that too quickly. Please wait a moment and try again.";
    }
    if (err.status === 500 || code === "INTERNAL_ERROR") {
        return "The server ran into a problem. Please try again, or contact support if the issue continues.";
    }

    // Fallback to whatever message is on the error if it looks human.
    return cleanupMessage(rawMessage) || fallback;
}

/**
 * Map a ServiceResult-style error envelope to a friendly message.
 * Use this on the client after calling `serviceRequest()`.
 */
export function formatServiceError(payload: any, fallback = "We couldn't complete that action."): string {
    if (!payload) return fallback;

    const candidate =
        payload?.error?.message ??
        payload?.error ??
        payload?.message ??
        payload;

    return formatErrorMessage(candidate, fallback);
}

function cleanupMessage(message: string): string {
    if (!message) return "";
    let m = message.trim();

    // Strip Mongo internals that may leak through.
    m = m.replace(/E\d{3,5}\s+/g, "").trim();
    m = m.replace(/\s+collection:\s*\S+/i, "").trim();
    m = m.replace(/\s+index:\s*\S+/i, "").trim();
    m = m.replace(/\s+dup key:.*$/i, "").trim();

    // Drop dangling library prefixes.
    m = m.replace(/^Error:\s*/i, "").trim();
    m = m.replace(/^MongoError:\s*/i, "").trim();
    m = m.replace(/^MongoServerError:\s*/i, "").trim();

    // Sentence case + ensure trailing period for readability.
    if (m.length > 0) {
        m = m.charAt(0).toUpperCase() + m.slice(1);
        if (!/[.!?]$/.test(m)) m = `${m}.`;
    }
    return m;
}

function humanizeFieldName(path: string): string {
    return path
        .replace(/_/g, " ")
        .replace(/\./g, " › ")
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
}
