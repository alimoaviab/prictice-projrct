// Package api defines shared HTTP types: the ServiceResult envelope, the
// RequestContext, and helpers that the original Node backend exposes via
// `serviceTry`. The frontend (school-react-app) depends on these exact JSON
// shapes — do not change them without coordinating with src/services/service-client.ts.
package api

// ServiceErrorPayload mirrors `ServiceError` in
// old-app/shared/types/core.ts.
type ServiceErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"status,omitempty"`
	Details any    `json:"details,omitempty"`
}

// ServiceResult is the universal response envelope returned by every API
// route in the original Node backend. The frontend's `serviceRequest`
// inspects `ok` first, then `data` or `error`. Reproduce verbatim.
type ServiceResult struct {
	Ok        bool                 `json:"ok"`
	Success   bool                 `json:"success"`
	Data      any                  `json:"data,omitempty"`
	Message   string               `json:"message,omitempty"`
	ErrorCode string               `json:"errorCode,omitempty"`
	Error     *ServiceErrorPayload `json:"error,omitempty"`
	Meta      map[string]any       `json:"meta,omitempty"`
}

// Ok returns a success ServiceResult.
func Ok(data any) ServiceResult {
	return ServiceResult{Ok: true, Success: true, Data: data}
}

// OkMessage returns a success ServiceResult with a human-readable message
// (e.g. "Your school account is under review.").
func OkMessage(data any, message string) ServiceResult {
	return ServiceResult{Ok: true, Success: true, Data: data, Message: message}
}

// Fail returns a failure ServiceResult with the same envelope the original
// `fail()` helper produces. status mirrors the HTTP status code so handlers
// can pass the same value to the response writer.
func Fail(code, message string, status int, details any) ServiceResult {
	return ServiceResult{
		Ok:        false,
		Success:   false,
		Message:   message,
		ErrorCode: code,
		Error: &ServiceErrorPayload{
			Code:    code,
			Message: message,
			Status:  status,
			Details: details,
		},
	}
}
