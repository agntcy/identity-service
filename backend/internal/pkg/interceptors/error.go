// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package interceptors

import (
	"context"
	"errors"

	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/grpcutil"
	"github.com/agntcy/identity-service/pkg/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/status"
)

var ErrInternalError = errors.New("internal server error")

type ErrorInterceptor struct {
	isProd bool
}

func NewErrorInterceptor(isProd bool) *ErrorInterceptor {
	return &ErrorInterceptor{isProd}
}

func (i ErrorInterceptor) Unary(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	resp, err := handler(ctx, req)
	if err != nil {
		// if it's a gRPC Status error then return it
		if _, ok := status.FromError(err); ok {
			return resp, err
		}

		if i.isIdentityContextError(err) {
			log.FromContext(ctx).WithError(err).Warn(err)

			return resp, grpcutil.UnauthorizedError(err)
		}

		log.FromContext(ctx).WithError(err).Error(err)

		var finalErr error

		if i.isProd {
			finalErr = ErrInternalError
		} else {
			finalErr = err
		}

		return resp, grpcutil.InternalError(finalErr)
	}

	return resp, err
}

func (i ErrorInterceptor) isIdentityContextError(err error) bool {
	return errors.Is(err, identitycontext.ErrTenantNotFound) ||
		errors.Is(err, identitycontext.ErrAppNotFound) ||
		errors.Is(err, identitycontext.ErrUserNotFound) ||
		errors.Is(err, identitycontext.ErrOrganizationNotFound)
}
