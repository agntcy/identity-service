// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	"time"

	identity_service_sdk_go "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func FromApp(src *apptypes.App) *identity_service_sdk_go.App {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.App{
		Id:                 ptrutil.Ptr(src.ID),
		Name:               src.Name,
		Description:        src.Description,
		Type:               ptrutil.Ptr(identity_service_sdk_go.AppType(src.Type)),
		Status:             ptrutil.Ptr(identity_service_sdk_go.AppStatus(src.Status)),
		ApiKey:             ptrutil.Ptr(src.ApiKey),
		CreatedAt:          newTimestamp(&src.CreatedAt),
		UpdatedAt:          newTimestamp(src.UpdatedAt),
		ResolverMetadataId: ptrutil.Ptr(src.ResolverMetadataID),
	}
}

func ToApp(src *identity_service_sdk_go.App) *apptypes.App {
	if src == nil {
		return nil
	}

	return &apptypes.App{
		ID:          src.GetId(),
		Name:        ptrutil.Ptr(src.GetName()),
		Description: ptrutil.Ptr(src.GetDescription()),
		Type:        apptypes.AppType(src.GetType()),
		Status:      apptypes.AppStatus(src.GetStatus()),
	}
}

func newTimestamp(t *time.Time) *timestamppb.Timestamp {
	if t != nil {
		return timestamppb.New(*t)
	}

	return nil
}
