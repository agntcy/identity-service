// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package errutil

import (
	"errors"
	"fmt"
	"strings"

	"github.com/outshift/identity-service/pkg/log"
)

func Err(err error, customMessage string) error {
	message := customMessage

	if err != nil {
		// Get last message if there is an error chain
		allErrs := strings.Split(err.Error(), ":")
		if len(allErrs) > 0 {
			message = fmt.Sprintf(
				"%s: %s",
				customMessage,
				strings.TrimSpace(allErrs[len(allErrs)-1]),
			)
		} else {
			message = fmt.Sprintf("%s: %s", customMessage, err.Error())
		}
	}

	// Log the full error message
	log.Error(customMessage, ": ", err)

	// Return a new error with the custom message
	return errors.New(message)
}

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

	// The underlying error if present
	Underlying error

	// The message describing the error in a human-readable way. This
	// field gives additional details about the error.
	Message string
}

func newDomainErrorf(id string, reason ErrorReason, err error, format string, args ...any) *DomainError {
	var msg string

	if len(args) > 0 {
		msg = fmt.Sprintf(format, args...)
	} else {
		msg = format
	}

	return &DomainError{
		ID:         id,
		Reason:     reason,
		Underlying: err,
		Message:    msg,
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
		err.Message == domainErr.Message &&
		(err.Underlying == nil || errors.Is(err.Underlying, domainErr.Underlying))
}

func (err *DomainError) Unwrap() error {
	return err.Underlying
}

func NotFound(id, format string, args ...any) error {
	return newDomainErrorf(id, ErrorReasonNotFound, nil, format, args...)
}

func ValidationFailed(id, format string, args ...any) error {
	return newDomainErrorf(id, ErrorReasonValidationFailed, nil, format, args...)
}

func InvalidRequest(id, format string, args ...any) error {
	return newDomainErrorf(id, ErrorReasonInvalidRequest, nil, format, args...)
}

func Unauthorized(id, format string, args ...any) error {
	return newDomainErrorf(id, ErrorReasonUnauthorized, nil, format, args...)
}

func IsDomainError(err error) bool {
	var derr *DomainError
	return errors.As(err, &derr)
}
