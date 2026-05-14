package api

import (
	"errors"
	"log"
)

// ServiceTry mirrors the `serviceTry` helper in
// old-app/shared/utils/result.ts: it wraps a service operation, catches
// thrown errors, and returns a `ServiceResult` with the appropriate envelope.
//
// Errors of type *ControlledError are reported with their own code/status.
// Other errors become "INTERNAL_ERROR" / 500.
func ServiceTry[T any](operation func() (T, error)) ServiceResult {
	value, err := operation()
	if err == nil {
		return Ok(value)
	}

	var ctrl *ControlledError
	if errors.As(err, &ctrl) {
		return Fail(ctrl.Code, ctrl.Message, ctrl.Status, ctrl.Details)
	}

	log.Printf("[serviceTry] internal error: %v", err)
	return Fail("INTERNAL_ERROR", "The request could not be completed. Please try again.", 500, nil)
}
