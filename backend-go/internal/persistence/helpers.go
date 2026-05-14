package persistence

import "encoding/json"

// nullableString converts an empty string to a nil interface so PostgreSQL
// stores NULL instead of "" in nullable columns.
func nullableString(s string) any {
	if s == "" {
		return nil
	}
	return s
}

// defaultStr returns `v` if non-empty, otherwise `d`. Used for the small set
// of fields where the original Mongoose schema has a default value but the
// in-memory struct may have left them as zero values.
func defaultStr(v, d string) string {
	if v == "" {
		return d
	}
	return v
}

// jsonOrEmpty marshals `v` to JSON bytes. nil → "{}". Used for JSONB
// columns (school_settings, audit_logs.before/after/metadata).
func jsonOrEmpty(v any) ([]byte, error) {
	if v == nil {
		return []byte("{}"), nil
	}
	body, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	if len(body) == 0 || string(body) == "null" {
		return []byte("{}"), nil
	}
	return body, nil
}

// jsonOrArray marshals `v` to JSON bytes. nil → "[]".
func jsonOrArray(v any) ([]byte, error) {
	if v == nil {
		return []byte("[]"), nil
	}
	body, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	if len(body) == 0 || string(body) == "null" {
		return []byte("[]"), nil
	}
	return body, nil
}
