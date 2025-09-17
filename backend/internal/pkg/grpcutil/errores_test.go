// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package grpcutil_test

import (
	"errors"
	"testing"

	"github.com/outshift/identity-service/internal/pkg/errutil"
	"github.com/outshift/identity-service/internal/pkg/grpcutil"
	"github.com/stretchr/testify/assert"
)

func TestGrpcError(t *testing.T) {
	t.Parallel()

	generalErr := errors.New("d")

	testCases := map[string]*struct {
		inErr  error
		outErr error
	}{
		"should return not found status error for ErrorReasonNotFound": {
			inErr:  errutil.NotFound("a", "a"),
			outErr: grpcutil.NotFoundError(errutil.NotFound("a", "a")),
		},
		"should return bad request status error for ErrorReasonValidationFailed": {
			inErr:  errutil.ValidationFailed("b", "b"),
			outErr: grpcutil.BadRequestError(errutil.ValidationFailed("b", "b")),
		},
		"should return bad request status error for ErrorReasonInvalidRequest": {
			inErr:  errutil.InvalidRequest("c", "c"),
			outErr: grpcutil.BadRequestError(errutil.InvalidRequest("c", "c")),
		},
		"should return the same error as input when it's not DomainError": {
			inErr:  generalErr,
			outErr: generalErr,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actualErr := grpcutil.Error(tc.inErr)

			assert.ErrorIs(t, actualErr, tc.outErr)
		})
	}
}
