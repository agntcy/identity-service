// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package interceptors

import (
	"context"
	"errors"

	"github.com/outshift/identity-service/internal/pkg/grpcutil"
	"github.com/outshift/identity-service/pkg/log"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/status"
)

var errInternalError = errors.New("internal server error")

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
		if _, ok := status.FromError(err); !ok {
			log.WithFields(logrus.Fields{log.ErrorField: err}).Error(err)

			var finalErr error

			if i.isProd {
				finalErr = errInternalError
			} else {
				finalErr = err
			}

			return resp, grpcutil.InternalError(finalErr)
		}
	}

	return resp, err
}
