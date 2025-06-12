// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package grpc

import (
	"github.com/agntcy/identity-platform/internal/bff"
	identity_platform_sdk_go "github.com/agntcy/identity/platform/api/server/agntcy/identity/platform/v1alpha1"
)

type appService struct {
	appSrv bff.AppService
}

func NewAppService(appSrv bff.AppService) identity_platform_sdk_go.AppServiceServer {
	return &appService{
		appSrv: appSrv,
	}
}
