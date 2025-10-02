// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package grpcutil_test

import (
	"encoding/json"
	"errors"
	"testing"

	"github.com/agntcy/identity-service/internal/pkg/errutil"
	"github.com/agntcy/identity-service/internal/pkg/grpcutil"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc/status"
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

func TestGrpcError_should_return_a_status_error_with_details(t *testing.T) {
	t.Parallel()

	inErr := errutil.ValidationFailed("domain.id", "this is a validation error")

	actualErr := grpcutil.Error(inErr)

	st, ok := status.FromError(actualErr)

	assert.True(t, ok)
	assert.Equal(t, inErr.Error(), st.Message())
	assert.Len(t, st.Details(), 1)

	detail := pbToMap(t, st.Details()[0])

	assert.Equal(
		t,
		map[string]any{
			"reason": string(errutil.ErrorReasonValidationFailed),
			"metadata": map[string]any{
				"messageId": "domain.id",
			},
			"domain": "domain",
		},
		detail,
	)
}

func pbToMap(t *testing.T, pb any) map[string]any {
	t.Helper()

	data, err := json.Marshal(&pb)
	assert.NoError(t, err)

	var m map[string]any

	assert.NoError(t, json.Unmarshal(data, &m))

	return m
}
