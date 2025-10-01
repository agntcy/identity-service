// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package interceptors

import (
	"context"
	"errors"
	"slices"
	"strings"

	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	"github.com/agntcy/identity-service/internal/pkg/grpcutil"
	"github.com/agntcy/identity-service/internal/pkg/iam"
	"github.com/agntcy/identity-service/pkg/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// ------------------------ GLOBAL -------------------- //

const (
	AuthorizationHeaderKey string = "authorization"
	APIKeyHeaderKey        string = "x-id-api-key" //nolint:gosec // This is a false positive
)

var allowedServicesWithoutAuth = []string{
	identity_service_sdk_go.DeviceService_RegisterDevice_FullMethodName,
	identity_service_sdk_go.BadgeService_VerifyBadge_FullMethodName,
	identity_service_sdk_go.AuthService_ApproveToken_FullMethodName,
	"/grpc.health.v1.Health/Check",
}

var allowedServicesWithAppAuth = []string{
	identity_service_sdk_go.AuthService_AppInfo_FullMethodName,
	identity_service_sdk_go.AuthService_Authorize_FullMethodName,
	identity_service_sdk_go.AuthService_Token_FullMethodName,
	identity_service_sdk_go.AuthService_ExtAuthz_FullMethodName,
	identity_service_sdk_go.BadgeService_IssueBadge_FullMethodName,
}

type AuthInterceptor struct {
	iamClient iam.Client
}

func NewAuthInterceptor(
	iamClient iam.Client,
) *AuthInterceptor {
	return &AuthInterceptor{
		iamClient: iamClient,
	}
}

// ------------------------ GLOBAL -------------------- //

// The unary interceptor is used for the REST and gRPC calls
func (ti *AuthInterceptor) Unary(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	// Check non-auth services
	// Healthz, etc.
	if slices.Contains(allowedServicesWithoutAuth, info.FullMethod) {
		return handler(ctx, req)
	}

	log.Debug("Auth Interceptor: ", info.FullMethod)

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("failed to extract metadata from context")
	}

	// This header will come for IAM Api Keys v1
	apiKeyHeader, okAPIKeyV1 := md[APIKeyHeaderKey]

	// This header will come for both IAM Api Keys v2 and User JWT
	authHeader, okAuth := md[AuthorizationHeaderKey]

	if !okAuth && !okAPIKeyV1 {
		return nil, grpcutil.UnauthorizedError(errors.New("failed to extract authorization"))
	}

	var (
		err  error
		aCtx context.Context
	)

	if okAuth {
		aCtx, err = ti.iamClient.AuthJwt(ctx, authHeader[0])
		if err != nil {
			return nil, grpcutil.UnauthorizedError(err)
		}
	} else {
		// Check the app auth services
		for _, allowed := range allowedServicesWithAppAuth {
			log.Debug("Checking if : ", info.FullMethod, " is in allowed services with app auth", allowed)

			if strings.Contains(info.FullMethod, allowed) {
				// Authenticate an app against IAM Api Keys v1
				aCtx, err := ti.iamClient.AuthAPIKey(ctx, apiKeyHeader[0], true)
				log.Debug("App auth context: ", aCtx)

				if err != nil {
					return nil, grpcutil.UnauthorizedError(err)
				}

				return handler(aCtx, req)
			}
		}

		// Authenticate a tenant against IAM Api Keys v1
		aCtx, err = ti.iamClient.AuthAPIKey(ctx, apiKeyHeader[0], false)
		if err != nil {
			return nil, grpcutil.UnauthorizedError(err)
		}
	}

	log.Debug("Auth context: ", aCtx)

	return handler(aCtx, req)
}
