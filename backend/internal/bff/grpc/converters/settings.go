// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	settingstypes "github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/internal/pkg/strutil"
)

func FromOktaIdpSettings(
	src *settingstypes.OktaIdpSettings,
) *identity_platform_sdk_go.OktaIdpSettings {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.OktaIdpSettings{
		OrgUrl:     ptrutil.Ptr(src.OrgUrl),
		ClientId:   ptrutil.Ptr(src.ClientID),
		PrivateKey: ptrutil.Ptr(strutil.Mask(src.PrivateKey)),
	}
}

func ToOktaIdpSettings(
	src *identity_platform_sdk_go.OktaIdpSettings,
) *settingstypes.OktaIdpSettings {
	if src == nil {
		return nil
	}

	return &settingstypes.OktaIdpSettings{
		OrgUrl:     src.GetOrgUrl(),
		ClientID:   src.GetClientId(),
		PrivateKey: src.GetPrivateKey(),
	}
}

func FromDuoIdpSettings(
	src *settingstypes.DuoIdpSettings,
) *identity_platform_sdk_go.DuoIdpSettings {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.DuoIdpSettings{
		Hostname:       ptrutil.Ptr(src.Hostname),
		IntegrationKey: ptrutil.Ptr(src.IntegrationKey),
		SecretKey:      ptrutil.Ptr(strutil.Mask(src.SecretKey)),
	}
}

func ToDuoIdpSettings(
	src *identity_platform_sdk_go.DuoIdpSettings,
) *settingstypes.DuoIdpSettings {
	if src == nil {
		return nil
	}

	return &settingstypes.DuoIdpSettings{
		Hostname:       src.GetHostname(),
		IntegrationKey: src.GetIntegrationKey(),
		SecretKey:      src.GetSecretKey(),
	}
}

func FromIssuerSettings(
	src *settingstypes.IssuerSettings,
) *identity_platform_sdk_go.IssuerSettings {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.IssuerSettings{
		IdpType:         ptrutil.Ptr(identity_platform_sdk_go.IdpType(src.IdpType)),
		OktaIdpSettings: FromOktaIdpSettings(src.OktaIdpSettings),
		DuoIdpSettings:  FromDuoIdpSettings(src.DuoIdpSettings),
	}
}

func ToIssuerSettings(
	src *identity_platform_sdk_go.IssuerSettings,
) *settingstypes.IssuerSettings {
	if src == nil {
		return nil
	}

	return &settingstypes.IssuerSettings{
		IdpType:         settingstypes.IdpType(src.GetIdpType()),
		OktaIdpSettings: ToOktaIdpSettings(src.GetOktaIdpSettings()),
		DuoIdpSettings:  ToDuoIdpSettings(src.GetDuoIdpSettings()),
	}
}

func FromApiKey(
	src *settingstypes.ApiKey,
) *identity_platform_sdk_go.ApiKey {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.ApiKey{
		ApiKey: ptrutil.Ptr(src.ApiKey),
	}
}

func FromSettings(src *settingstypes.Settings) *identity_platform_sdk_go.Settings {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.Settings{
		IssuerSettings: FromIssuerSettings(src.IssuerSettings),
		ApiKey:         FromApiKey(src.ApiKey),
	}
}
