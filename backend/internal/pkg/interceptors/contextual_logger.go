// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package interceptors

import (
	"context"
	"maps"
	"strings"

	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/pkg/log"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// Enriches logs with identity context (tenantID, userID, etc.)
// and information about the current gRPC request.
//
// It does this by adding a value containing those fields to the context
// and pass it to the next handler, and to include those fields when logging,
// use log.FromContext(ctx).

// Enriches the context with tenant and request metadata for structured logging.
//
// This interceptor extracts tenant related information (such as tenant ID, app ID, etc.) from
// the incoming context, as well as the full gRPC method name and the current request.
//
// Downstream handlers can then use log.FromContext(ctx) to access and include these enriched
// fields in their log entries.
func ContextualLoggerUnary(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	fields := make(logrus.Fields)

	if tenantID, ok := identitycontext.GetTenantID(ctx); ok {
		fields["tenant_id"] = tenantID
	}

	if appID, ok := identitycontext.GetAppID(ctx); ok {
		fields["app_id"] = appID
	}

	if orgID, ok := identitycontext.GetOrganizationID(ctx); ok {
		fields["organization_id"] = orgID
	}

	if userID, ok := identitycontext.GetUserID(ctx); ok {
		fields["user_id"] = userID
	}

	if requestID, ok := identitycontext.GetRequestID(ctx); ok {
		fields["request_id"] = requestID
	}

	fields["full_method"] = info.FullMethod

	requestFields := logrus.Fields{}

	if md, ok := metadata.FromIncomingContext(ctx); ok {
		filtered := removeSensitiveDataFromMD(md)
		maps.Copy(requestFields, filtered)
	}

	if len(requestFields) > 0 {
		fields["request"] = requestFields
	}

	return handler(log.EnrichContext(ctx, fields), req)
}

func removeSensitiveDataFromMD(md metadata.MD) map[string]any {
	filtered := make(map[string]any)

	for k, v := range md {
		header := strings.ToLower(k)
		if len(v) == 0 ||
			strings.Contains(header, AuthorizationHeaderKey) ||
			strings.Contains(header, APIKeyHeaderKey) {
			continue
		}

		filtered[k] = v[0]
	}

	return filtered
}
