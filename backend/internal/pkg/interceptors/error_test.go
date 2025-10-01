// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package interceptors_test

import (
	"context"
	"errors"
	"testing"

	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/grpcutil"
	"github.com/agntcy/identity-service/internal/pkg/interceptors"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
)

func TestErrorInterceptor(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		err         error
		isProd      bool
		expectedErr error
	}{
		"should return no errors": {
			err:         nil,
			expectedErr: nil,
		},
		"should return the gRPC error received from the next handler": {
			err:         grpcutil.BadRequestError(errors.New("failed")),
			expectedErr: grpcutil.BadRequestError(errors.New("failed")),
		},
		"should return unauthorized gRPC error for identitycontext.ErrTenantNotFound": {
			err:         identitycontext.ErrTenantNotFound,
			expectedErr: grpcutil.UnauthorizedError(identitycontext.ErrTenantNotFound),
		},
		"should return unauthorized gRPC error for identitycontext.ErrAppNotFound": {
			err:         identitycontext.ErrAppNotFound,
			expectedErr: grpcutil.UnauthorizedError(identitycontext.ErrAppNotFound),
		},
		"should return unauthorized gRPC error for identitycontext.ErrUserNotFound": {
			err:         identitycontext.ErrUserNotFound,
			expectedErr: grpcutil.UnauthorizedError(identitycontext.ErrUserNotFound),
		},
		"should return unauthorized gRPC error for identitycontext.ErrOrganizationNotFound": {
			err:         identitycontext.ErrOrganizationNotFound,
			expectedErr: grpcutil.UnauthorizedError(identitycontext.ErrOrganizationNotFound),
		},
		"should return internal gRPC error with the original msg for non custom error": {
			err:         errors.New("failed"),
			expectedErr: grpcutil.InternalError(errors.New("failed")),
		},
		"should return internal gRPC error with a custom msg in prod for non custom error": {
			isProd:      true,
			err:         errors.New("failed"),
			expectedErr: grpcutil.InternalError(interceptors.ErrInternalError),
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := interceptors.NewErrorInterceptor(tc.isProd)

			_, err := sut.Unary(
				t.Context(),
				"request",
				&grpc.UnaryServerInfo{},
				func(ctx context.Context, req any) (any, error) {
					return "response", tc.err
				},
			)

			assert.ErrorIs(t, err, tc.expectedErr)
		})
	}
}
