// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package interceptors

import (
	"context"
	"errors"

	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// ------------------------ GLOBAL -------------------- //

const (
	AuthorizationHeaderKey string = "authorization"
	APIKeyHeaderKey        string = "x-id-api-key" //nolint:gosec // This is a false positive
)

var allowedServicesWithoutAuth = []string{
	"/grpc.health.v1.Health/Check",
}

type AuthInterceptor struct {
	iam          outshiftiam.IAM
	iamProductID string
}

func NewAuthInterceptor(
	iam outshiftiam.IAM,
	iamProductID string,
) *AuthInterceptor {
	return &AuthInterceptor{
		iam:          iam,
		iamProductID: iamProductID,
	}
}

// ------------------------ GLOBAL -------------------- //

// The unary interceptor is used for the REST and gRPC calls
func (ti *AuthInterceptor) Unary(
	ctx context.Context,
	req interface{},
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (i interface{}, err error) {
	// Check non-auth services
	// Healthz, etc.
	for _, service := range allowedServicesWithoutAuth {
		if info.FullMethod == service {
			return handler(ctx, req)
		}
	}

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("failed to extract metadata from context")
	}

	// This header will come for both IAM API Keys v2 and User JWT
	authHeader, okAuth := md[AuthorizationHeaderKey]

	// This header will come for IAM API Keys v1
	apiKeyHeader, okApiKeyV1 := md[APIKeyHeaderKey]

	if !okAuth && !okApiKeyV1 {
		return nil, grpcutil.UnauthorizedError(errors.New("failed to extract authorization"))
	}

	if okAuth {
		ctx, err = ti.iam.AuthJwt(ctx, authHeader[0])
		if err != nil {
			return nil, grpcutil.UnauthorizedError(err)
		}
	} else {
		// This is an IAM v1 key without any deployment tag
		ctx, err = ti.iam.AuthAPIKey(ctx, ti.iamProductID, apiKeyHeader[0], false)
		if err != nil {
			return nil, grpcutil.UnauthorizedError(err)
		}
	}
	return handler(ctx, req)
}
