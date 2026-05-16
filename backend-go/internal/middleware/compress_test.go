package middleware

import (
	"compress/gzip"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── Test Helpers ────────────────────────────────────────────────────────

// newTestRouter creates a Chi router with the Compress middleware and a test handler.
func newTestRouter(handler http.HandlerFunc) *chi.Mux {
	r := chi.NewRouter()
	r.Use(Compress)
	r.Get("/test", handler)
	return r
}

// largeJSON generates a JSON payload large enough to trigger compression.
func largeJSON() []byte {
	data := map[string]any{
		"students": make([]map[string]any, 50),
	}
	for i := range data["students"].([]map[string]any) {
		data["students"].([]map[string]any)[i] = map[string]any{
			"id":         i,
			"first_name": "Student Name That Is Reasonably Long For Testing",
			"last_name":  "LastName With Some Extra Characters For Size",
			"email":      "student@example.com",
			"class":      "Class 10A Section B",
			"status":     "active",
		}
	}
	b, _ := json.Marshal(data)
	return b
}

// ─── TEST: Gzip Compression Applied ──────────────────────────────────────

func TestGzipCompression_Applied(t *testing.T) {
	payload := largeJSON()

	router := newTestRouter(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(payload)
	})

	// Act: request with Accept-Encoding: gzip
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert: response is gzip-compressed
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "gzip", w.Header().Get("Content-Encoding"))

	// Verify the body is valid gzip and decompresses to the original JSON
	reader, err := gzip.NewReader(w.Body)
	require.NoError(t, err, "response body should be valid gzip")
	defer reader.Close()

	decompressed, err := io.ReadAll(reader)
	require.NoError(t, err)

	// Verify decompressed content is valid JSON matching original
	var original, decoded map[string]any
	require.NoError(t, json.Unmarshal(payload, &original))
	require.NoError(t, json.Unmarshal(decompressed, &decoded))
	assert.Equal(t, len(original["students"].([]any)), len(decoded["students"].([]any)))

	// Verify compression actually reduced size
	assert.Less(t, w.Body.Len(), len(payload),
		"compressed size (%d) should be less than original (%d)", w.Body.Len(), len(payload))
}

// ─── TEST: No Compression Without Accept-Encoding ────────────────────────

func TestCompression_NotApplied_NoAcceptEncoding(t *testing.T) {
	payload := largeJSON()

	router := newTestRouter(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(payload)
	})

	// Act: request WITHOUT Accept-Encoding header
	req := httptest.NewRequest("GET", "/test", nil)
	// Explicitly remove any default encoding
	req.Header.Del("Accept-Encoding")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert: no compression applied
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Empty(t, w.Header().Get("Content-Encoding"))
	assert.Equal(t, len(payload), w.Body.Len())
}

// ─── TEST: Compression Only for Eligible Content Types ───────────────────

func TestCompression_JsonContentType_Compressed(t *testing.T) {
	tests := []struct {
		name        string
		contentType string
		shouldGzip  bool
	}{
		{"application/json", "application/json", true},
		{"text/plain", "text/plain", true},
		{"text/html", "text/html", true},
		{"image/png", "image/png", false},
		{"image/jpeg", "image/jpeg", false},
		{"application/octet-stream", "application/octet-stream", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Use a large payload to ensure compression threshold is met
			payload := strings.Repeat("x", 2048)

			router := newTestRouter(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", tt.contentType)
				_, _ = w.Write([]byte(payload))
			})

			req := httptest.NewRequest("GET", "/test", nil)
			req.Header.Set("Accept-Encoding", "gzip")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if tt.shouldGzip {
				assert.Equal(t, "gzip", w.Header().Get("Content-Encoding"),
					"expected gzip for %s", tt.contentType)
			} else {
				assert.NotEqual(t, "gzip", w.Header().Get("Content-Encoding"),
					"should NOT gzip %s", tt.contentType)
			}
		})
	}
}

// ─── TEST: Compression Ratio ─────────────────────────────────────────────

func TestCompression_SignificantReduction(t *testing.T) {
	// Create a realistic JSON payload (~5KB)
	payload := largeJSON()
	require.Greater(t, len(payload), 1024, "test payload should be >1KB")

	router := newTestRouter(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(payload)
	})

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert: at least 50% compression on JSON
	ratio := float64(w.Body.Len()) / float64(len(payload))
	assert.Less(t, ratio, 0.5,
		"compression ratio should be <50%%, got %.1f%% (original=%d, compressed=%d)",
		ratio*100, len(payload), w.Body.Len())
}
