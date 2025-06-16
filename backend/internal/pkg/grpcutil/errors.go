// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
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
