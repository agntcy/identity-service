// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package interceptors

import (
	"context"
	"errors"
	"strings"

	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	outshiftiam "github.com/agntcy/identity-platform/internal/pkg/iam"
	"github.com/agntcy/identity-platform/pkg/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// ------------------------ GLOBAL -------------------- //

const (
	AuthorizationHeaderKey string = "authorization"
	ApiKeyHeaderKey        string = "x-id-api-key" //nolint:gosec // This is a false positive
)

var allowedServicesWithoutAuth = []string{
	"/agntcy.identity.platform.v1alpha1.BadgeService/VerifyBadge",
	"/grpc.health.v1.Health/Check",
}

var allowedServicesWithAppAuth = []string{
	"/agntcy.identity.platform.v1alpha1.AuthService/AppInfo",
	"/agntcy.identity.platform.v1alpha1.AuthService/Authorize",
	"/agntcy.identity.platform.v1alpha1.AuthService/Token",
	"/agntcy.identity.platform.v1alpha1.AuthService/ExtAuthz",
}

type AuthInterceptor struct {
	iam          outshiftiam.Client
	iamProductID string
}

func NewAuthInterceptor(
	iam outshiftiam.Client,
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
) (interface{}, error) {
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

	// This header will come for IAM Api Keys v1
	apiKeyHeader, okApiKeyV1 := md[ApiKeyHeaderKey]

	// This header will come for both IAM Api Keys v2 and User JWT
	authHeader, okAuth := md[AuthorizationHeaderKey]

	if !okAuth && !okApiKeyV1 {
		return nil, grpcutil.UnauthorizedError(errors.New("failed to extract authorization"))
	}

	var err error
	var aCtx context.Context

	if okAuth {
		aCtx, err = ti.iam.AuthJwt(ctx, authHeader[0])
		if err != nil {
			return nil, grpcutil.UnauthorizedError(err)
		}
	} else {
		// Check the app auth services
		for _, allowed := range allowedServicesWithAppAuth {
			log.Debug("Checking if : ", info.FullMethod, " is in allowed services with app auth", allowed)

			if strings.Contains(info.FullMethod, allowed) {
				// Authenticate an app against IAM Api Keys v1
				aCtx, err := ti.iam.AuthApiKey(ctx, ti.iamProductID, apiKeyHeader[0], true)
				if err != nil {
					return nil, grpcutil.UnauthorizedError(err)
				}

				return handler(aCtx, req)
			}
		}

		// Authenticate a tenant against IAM Api Keys v1
		aCtx, err = ti.iam.AuthApiKey(ctx, ti.iamProductID, apiKeyHeader[0], false)
		if err != nil {
			return nil, grpcutil.UnauthorizedError(err)
		}
	}

	return handler(aCtx, req)
}
