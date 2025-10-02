// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package errutil

import (
	"errors"
	"fmt"
)

type ErrorReason string

const (
	ErrorReasonUnknown          ErrorReason = ""
	ErrorReasonNotFound         ErrorReason = "not_found"
	ErrorReasonValidationFailed ErrorReason = "validation_failed"
	ErrorReasonInvalidRequest   ErrorReason = "invalid_request"
	ErrorReasonUnauthorized     ErrorReason = "unauthorized"
)

type DomainError struct {
	// An ID used to identify the error for better localization.
	ID string

	// The reason of the error, as defined by the ErrorReason enum.
	// This is a constant unique value that helps identify the cause of
	// the error.
	Reason ErrorReason

	// The message describing the error in a human-readable way. This
	// field gives additional details about the error.
	Message string
}

func newDomainErrorf(id string, reason ErrorReason, format string, args ...any) *DomainError {
	var msg string

	if len(args) > 0 {
		msg = fmt.Sprintf(format, args...)
	} else {
		msg = format
	}

	return &DomainError{
		ID:      id,
		Reason:  reason,
		Message: msg,
	}
}

func (err *DomainError) Error() string {
	return err.Message
}

func (err *DomainError) Is(target error) bool {
	domainErr, ok := target.(*DomainError)
	if !ok {
		return false
	}

	return err.ID == domainErr.ID &&
		err.Reason == domainErr.Reason &&
		err.Message == domainErr.Message
}

func NotFound(id, format string, args ...any) error {
	return newDomainErrorf(id, ErrorReasonNotFound, format, args...)
}

func ValidationFailed(id, format string, args ...any) error {
	return newDomainErrorf(id, ErrorReasonValidationFailed, format, args...)
}

func InvalidRequest(id, format string, args ...any) error {
	return newDomainErrorf(id, ErrorReasonInvalidRequest, format, args...)
}

func Unauthorized(id, format string, args ...any) error {
	return newDomainErrorf(id, ErrorReasonUnauthorized, format, args...)
}

func IsDomainError(err error) bool {
	var derr *DomainError
	return errors.As(err, &derr)
}
