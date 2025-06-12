// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package grpc

import (
	"context"

	nodeapi "github.com/agntcy/identity-platform/api/server/agntcy/identity-platform/node/v1alpha1"
	errtypes "github.com/agntcy/identity-platform/internal/core/errors/types"
	"github.com/agntcy/identity-platform/internal/node"
	"github.com/agntcy/identity-platform/internal/node/grpc/converters"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
)

type idService struct {
	idSrv node.IdService
}

func NewIdService(idSrv node.IdService) nodeapi.IdServiceServer {
	return &idService{
		idSrv: idSrv,
	}
}

// Generate an Id and its corresponding ResolverMetadata for the specified Issuer
func (s *idService) Generate(
	ctx context.Context,
	req *nodeapi.GenerateRequest,
) (*nodeapi.GenerateResponse, error) {
	md, err := s.idSrv.Generate(
		ctx,
		converters.ToIssuer(req.Issuer),
		converters.ToProof(req.Proof),
	)
	if err != nil {
		if errtypes.IsErrorInfo(err, errtypes.ERROR_REASON_INTERNAL) {
			return nil, grpcutil.InternalError(err)
		}

		return nil, grpcutil.BadRequestError(err)
	}

	return &nodeapi.GenerateResponse{
		ResolverMetadata: converters.FromResolverMetadata(md),
	}, nil
}

// Resolve a specified Id to its corresponding ResolverMetadata
func (s *idService) Resolve(
	ctx context.Context,
	req *nodeapi.ResolveRequest,
) (*nodeapi.ResolveResponse, error) {
	md, err := s.idSrv.Resolve(ctx, req.Id)
	if err != nil {
		if errtypes.IsErrorInfo(err, errtypes.ERROR_REASON_RESOLVER_METADATA_NOT_FOUND) {
			return nil, grpcutil.NotFoundError(err)
		}

		return nil, grpcutil.InternalError(err)
	}

	return &nodeapi.ResolveResponse{
		ResolverMetadata: converters.FromResolverMetadata(md),
	}, nil
}
