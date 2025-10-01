// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package grpcutil

import (
	"errors"
	"strings"

	"github.com/agntcy/identity-service/internal/pkg/errutil"
	epb "google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func NotFoundError(err error) error {
	return newStatusWithDetails(codes.NotFound, err)
}

func UnauthorizedError(err error) error {
	return newStatusWithDetails(codes.Unauthenticated, err)
}

func BadRequestError(err error) error {
	return newStatusWithDetails(codes.InvalidArgument, err)
}

func InternalError(err error) error {
	return newStatusWithDetails(codes.Internal, err)
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

func newStatusWithDetails(c codes.Code, err error) error {
	st := status.New(c, err.Error())
	domainErr := &errutil.DomainError{}

	if errors.As(err, &domainErr) {
		domain := ""
		if before, _, found := strings.Cut(domainErr.ID, "."); found {
			domain = before
		}

		st, _ = st.WithDetails(&epb.ErrorInfo{
			Reason: string(domainErr.Reason),
			Domain: domain,
			Metadata: map[string]string{
				"messageId": domainErr.ID,
			},
		})
	}

	return st.Err()
}
