// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package grpc

import (
	"context"
	"errors"

	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"github.com/agntcy/identity-platform/internal/bff"
	"github.com/agntcy/identity-platform/internal/bff/grpc/converters"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
)

type BadgeService struct {
	badgeService bff.BadgeService
}

func NewBadgeService(badgeService bff.BadgeService) identity_platform_sdk_go.BadgeServiceServer {
	return &BadgeService{
		badgeService: badgeService,
	}
}

func (s *BadgeService) IssueBadge(
	ctx context.Context,
	in *identity_platform_sdk_go.IssueBadgeRequest,
) (*identity_platform_sdk_go.Badge, error) {
	if in == nil {
		return nil, grpcutil.BadRequestError(errors.New("request is empty"))
	}

	options := make([]bff.IssueOption, 0)

	if in.A2A != nil {
		options = append(options, bff.WithA2A(in.A2A.WellKnownUrl))
	}

	if in.Mcp != nil {
		options = append(options, bff.WithMCP(in.Mcp.Name, in.Mcp.Url))
	}

	badge, err := s.badgeService.IssueBadge(ctx, in.AppId, options...)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return converters.FromBadge(badge), nil
}
