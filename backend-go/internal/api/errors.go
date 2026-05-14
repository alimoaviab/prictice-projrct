package api

// ControlledError mirrors the `ControlledError` class from
// old-app/shared/types/core.ts. Services panic this when they want to bubble
// a controlled (user-facing) error with a stable code + status. The HTTP
// layer recovers and renders it through the same ServiceResult envelope.
type ControlledError struct {
	Code    string
	Message string
	Status  int
	Details any
}

func (e *ControlledError) Error() string {
	return e.Message
}

// NewControlledError mirrors `new ControlledError(code, message, status, details)`.
func NewControlledError(code, message string, status int, details any) *ControlledError {
	if status == 0 {
		status = 400
	}
	return &ControlledError{
		Code:    code,
		Message: message,
		Status:  status,
		Details: details,
	}
}
