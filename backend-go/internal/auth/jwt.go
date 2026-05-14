package auth

import (
	"errors"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/golang-jwt/jwt/v5"
)

// Claims mirrors the `AuthTokenPayload` in old-app/shared/auth/jwt.ts.
// The frontend (school-react-app/src/utils/jwt.ts and useAuth.ts) reads
// these exact claim names — do not rename.
type Claims struct {
	SchoolID             string   `json:"school_id"`
	Role                 string   `json:"role"`
	Permissions          []string `json:"permissions"`
	ActiveAcademicYearID string   `json:"active_academic_year_id,omitempty"`
	SessionID            string   `json:"session_id"`
	App                  string   `json:"app"`
	ActorEmail           string   `json:"actor_email,omitempty"`
	jwt.RegisteredClaims
}

// SignToken issues an HS256 JWT carrying the same claim set as
// `signAuthToken()` in the Node backend.
func SignToken(secret, app string, c Claims, ttl time.Duration) (string, error) {
	if secret == "" {
		return "", errors.New("JWT_SECRET is required")
	}
	now := time.Now()
	if c.IssuedAt == nil {
		c.IssuedAt = jwt.NewNumericDate(now)
	}
	c.ExpiresAt = jwt.NewNumericDate(now.Add(ttl))
	c.App = app

	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	return tok.SignedString([]byte(secret))
}

// VerifyToken validates a token's signature and `app` claim and returns the
// parsed claims. Mirrors `verifyAuthToken()` from the Node backend including
// the "Invalid token format" early-return and the app-mismatch check.
func VerifyToken(secret, expectedApp, token string) (*Claims, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, errors.New("Token is empty or invalid.")
	}
	if !strings.HasPrefix(token, "eyJ") {
		return nil, errors.New("Invalid token format. Expected JWT.")
	}

	parsed, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		// Preserve the same human-readable messages the frontend already
		// surfaces. We map jwt-go errors onto the Node messages.
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, errors.New("Token has expired. Please log in again.")
		}
		return nil, errors.New("JWT verification failed: " + err.Error())
	}

	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, errors.New("Invalid token claims.")
	}
	if expectedApp != "" && claims.App != expectedApp {
		return nil, errors.New("Invalid application session.")
	}
	return claims, nil
}

// ContextFromClaims mirrors `contextFromToken` in the Node backend. It
// produces the RequestContext that downstream services consume.
func ContextFromClaims(c *Claims) *api.RequestContext {
	return &api.RequestContext{
		SchoolID:             c.SchoolID,
		UserID:               c.Subject,
		Role:                 c.Role,
		App:                  c.App,
		Permissions:          c.Permissions,
		ActiveAcademicYearID: c.ActiveAcademicYearID,
		SessionID:            c.SessionID,
		ActorEmail:           c.ActorEmail,
	}
}
