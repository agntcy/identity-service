// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package grpcutil

import (
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func NotFoundError(err error) error {
	return status.Errorf(codes.NotFound, "%v", err)
}

func UnauthorizedError(err error) error {
	return status.Errorf(codes.Unauthenticated, "%v", err)
}

func UnimplementedError(err error) error {
	return status.Errorf(codes.Unimplemented, "%v", err)
}

func BadRequestError(err error) error {
	return status.Errorf(codes.InvalidArgument, "%v", err)
}

func InternalError(err error) error {
	return status.Errorf(codes.Internal, "%v", err)
}
