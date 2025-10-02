// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	devicetypes "github.com/agntcy/identity-service/internal/core/device/types"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
)

func ToDevice(
	src *identity_service_sdk_go.Device,
) *devicetypes.Device {
	if src == nil {
		return nil
	}

	return &devicetypes.Device{
		ID:                src.GetId(),
		UserID:            src.GetUserId(),
		SubscriptionToken: src.GetSubscriptionToken(),
		Name:              src.GetName(),
		CreatedAt:         src.GetCreatedAt().AsTime(),
	}
}

func FromDevice(
	src *devicetypes.Device,
) *identity_service_sdk_go.Device {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.Device{
		Id:                ptrutil.Ptr(src.ID),
		UserId:            ptrutil.Ptr(src.UserID),
		SubscriptionToken: ptrutil.Ptr(src.SubscriptionToken),
		Name:              ptrutil.Ptr(src.Name),
		CreatedAt:         newTimestamp(&src.CreatedAt),
	}
}
