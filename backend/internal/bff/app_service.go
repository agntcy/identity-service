// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package bff

import (
	appcore "github.com/agntcy/identity/platform/internal/core/app"
)

type AppService interface {
}

type appService struct {
	appRepository appcore.Repository
}

func NewAppService(
	appRepository appcore.Repository,
) AppService {
	return &appService{
		appRepository: appRepository,
	}
}
