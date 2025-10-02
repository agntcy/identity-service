// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package grpc

import (
	"context"

	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	"github.com/agntcy/identity-service/internal/bff"
	"github.com/agntcy/identity-service/internal/bff/grpc/converters"
	"github.com/agntcy/identity-service/internal/pkg/errutil"
	"github.com/agntcy/identity-service/internal/pkg/grpcutil"
)

type BadgeService struct {
	badgeService bff.BadgeService
}

func NewBadgeService(badgeService bff.BadgeService) identity_service_sdk_go.BadgeServiceServer {
	return &BadgeService{
		badgeService: badgeService,
	}
}

func (s *BadgeService) IssueBadge(
	ctx context.Context,
	in *identity_service_sdk_go.IssueBadgeRequest,
) (*identity_service_sdk_go.Badge, error) {
	if in == nil {
		return nil, grpcutil.BadRequestError(
			errutil.ValidationFailed("badge.invalidRequest", "Invalid request."),
		)
	}

	options := make([]bff.IssueOption, 0)

	if in.A2A != nil {
		options = append(options, bff.WithA2A(in.A2A.WellKnownUrl, in.A2A.SchemaBase64))
	}

	if in.Mcp != nil {
		options = append(options, bff.WithMCP(in.Mcp.Name, in.Mcp.Url, in.Mcp.SchemaBase64))
	}

	if in.Oasf != nil {
		options = append(options, bff.WithOASF(in.Oasf.SchemaBase64))
	}

	badge, err := s.badgeService.IssueBadge(ctx, in.AppId, options...)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromBadge(badge), nil
}

func (s *BadgeService) VerifyBadge(
	ctx context.Context,
	in *identity_service_sdk_go.VerifyBadgeRequest,
) (*identity_service_sdk_go.VerificationResult, error) {
	result, err := s.badgeService.VerifyBadge(
		ctx,
		&in.Badge,
	)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromVerificationResult(result), nil
}
