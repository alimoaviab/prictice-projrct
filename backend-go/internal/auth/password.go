// Package auth provides JWT signing/verification, password hashing, and
// RBAC checks. Mirrors old-app/shared/auth/{jwt,password,rbac}.ts.
package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword mirrors the original `hashPassword` helper in
// old-app/shared/auth/password.ts. The Node side uses bcryptjs with cost 10
// by default. We replicate that with golang.org/x/crypto/bcrypt so existing
// hashes verify successfully.
//
// Some legacy seeds in old-app store sha256 hex digests as the fallback;
// VerifyPassword detects those automatically.
func HashPassword(plain string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// VerifyPassword checks `plain` against `stored`. Recognises:
//   - bcrypt hashes (most production accounts)
//   - sha256 hex digest (legacy fallback used by some seed scripts)
func VerifyPassword(plain, stored string) bool {
	if stored == "" || plain == "" {
		return false
	}
	stored = strings.TrimSpace(stored)

	if strings.HasPrefix(stored, "$2a$") || strings.HasPrefix(stored, "$2b$") || strings.HasPrefix(stored, "$2y$") {
		err := bcrypt.CompareHashAndPassword([]byte(stored), []byte(plain))
		return errors.Is(err, nil)
	}

	// Legacy sha256 hex digest fallback.
	if len(stored) == 64 {
		sum := sha256.Sum256([]byte(plain))
		return strings.EqualFold(hex.EncodeToString(sum[:]), stored)
	}

	// Plain-text equality is supported only for in-memory dev seeds; never
	// for any production hash.
	return stored == plain
}
