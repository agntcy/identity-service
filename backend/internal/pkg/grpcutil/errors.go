// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package grpcutil

import (
	"errors"

	"github.com/outshift/identity-service/internal/pkg/errutil"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func NotFoundError(err error) error {
	return status.Errorf(codes.NotFound, "%v", err)
}

func UnauthorizedError(err error) error {
	return status.Errorf(codes.Unauthenticated, "%v", err)
}

func BadRequestError(err error) error {
	return status.Errorf(codes.InvalidArgument, "%v", err)
}

func InternalError(err error) error {
	return status.Errorf(codes.Internal, "%v", err)
}

func Error(err error) error {
	domainErr := &errutil.DomainError{}
	if errors.As(err, &domainErr) {
		switch domainErr.Reason {
		case errutil.ErrorReasonNotFound:
			return NotFoundError(err)
		case errutil.ErrorReasonValidationFailed:
			return BadRequestError(err)
		case errutil.ErrorReasonInvalidRequest:
			return BadRequestError(err)
		}
	}

	return err
}
