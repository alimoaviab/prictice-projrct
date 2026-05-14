package api

import (
	"encoding/json"
	"net/http"
)

// WriteJSON writes a ServiceResult to the response with the given status
// code. Mirrors how `handleApiResponse` works in old-app/school-app/lib/api-utils.ts.
func WriteJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

// WriteResult writes a ServiceResult with the appropriate status code: 200
// when `Ok`, otherwise the status carried in the error payload (default 400).
func WriteResult(w http.ResponseWriter, result ServiceResult) {
	status := http.StatusOK
	if !result.Ok {
		status = http.StatusBadRequest
		if result.Error != nil && result.Error.Status != 0 {
			status = result.Error.Status
		}
	}
	WriteJSON(w, status, result)
}

// WriteFail is shorthand for WriteResult with a Fail envelope.
func WriteFail(w http.ResponseWriter, code, message string, status int, details any) {
	WriteResult(w, Fail(code, message, status, details))
}
