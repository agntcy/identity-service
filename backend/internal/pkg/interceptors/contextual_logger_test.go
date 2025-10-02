// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package interceptors_test

import (
	"context"
	"testing"

	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/interceptors"
	"github.com/agntcy/identity-service/pkg/log"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

func TestContextualLoggerUnary_should_enrich_with_identity_context(t *testing.T) {
	t.Parallel()

	ctx := context.Background()

	testCases := map[string]*struct {
		ctx         context.Context //nolint:containedctx // essential part of the test case
		field       string
		expectedVal string
	}{
		"application id": {
			ctx:         identitycontext.InsertAppID(ctx, "appID"),
			field:       "app_id",
			expectedVal: "appID",
		},
		"organization id": {
			ctx:         identitycontext.InsertOrganizationID(ctx, "orgID"),
			field:       "organization_id",
			expectedVal: "orgID",
		},
		"request id": {
			ctx:         identitycontext.InsertRequestID(ctx, "reqID"),
			field:       "request_id",
			expectedVal: "reqID",
		},
		"tenant id": {
			ctx:         identitycontext.InsertTenantID(ctx, "tenantID"),
			field:       "tenant_id",
			expectedVal: "tenantID",
		},
		"user id": {
			ctx:         identitycontext.InsertUserID(ctx, "userID"),
			field:       "user_id",
			expectedVal: "userID",
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			handlerWithAssertion := func(ctx context.Context, req any) (any, error) {
				assert.Equal(t, tc.expectedVal, log.FromContext(ctx).Data[tc.field])

				return "", nil
			}

			_, _ = interceptors.ContextualLoggerUnary(
				tc.ctx,
				nil,
				&grpc.UnaryServerInfo{},
				handlerWithAssertion,
			)
		})
	}
}

func TestContextualLoggerUnary_should_enrich_with_grpc_request(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	ctx = metadata.NewIncomingContext(
		ctx,
		metadata.New(
			map[string]string{
				"key1":                       "key1_value",
				"AUTHORIZATION":              uuid.NewString(),
				"key2":                       "key2_value",
				"key_authorization":          uuid.NewString(),
				interceptors.APIKeyHeaderKey: uuid.NewString(),
			},
		),
	)
	fullMethod := uuid.NewString()

	handlerWithAssertion := func(ctx context.Context, req any) (any, error) {
		reqField := log.FromContext(ctx).Data["request"]
		fullMethodField := log.FromContext(ctx).Data["full_method"]

		assert.Equal(
			t,
			logrus.Fields{"key1": "key1_value", "key2": "key2_value"},
			reqField,
		)
		assert.Equal(t, fullMethod, fullMethodField)

		return "", nil
	}

	_, _ = interceptors.ContextualLoggerUnary(
		ctx,
		nil,
		&grpc.UnaryServerInfo{FullMethod: fullMethod},
		handlerWithAssertion,
	)
}
