// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	settingstypes "github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/internal/pkg/strutil"
)

func FromOktaIdpSettings(
	src *settingstypes.OktaIdpSettings,
) *identity_service_sdk_go.OktaIdpSettings {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.OktaIdpSettings{
		OrgUrl:     ptrutil.Ptr(src.OrgUrl),
		ClientId:   ptrutil.Ptr(src.ClientID),
		PrivateKey: ptrutil.Ptr(strutil.Mask(src.PrivateKey)),
	}
}

func ToOktaIdpSettings(
	src *identity_service_sdk_go.OktaIdpSettings,
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
) *identity_service_sdk_go.DuoIdpSettings {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.DuoIdpSettings{
		Hostname:       ptrutil.Ptr(src.Hostname),
		IntegrationKey: ptrutil.Ptr(src.IntegrationKey),
		SecretKey:      ptrutil.Ptr(strutil.Mask(src.SecretKey)),
	}
}

func ToDuoIdpSettings(
	src *identity_service_sdk_go.DuoIdpSettings,
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

func FromOryIdpSettings(
	src *settingstypes.OryIdpSettings,
) *identity_service_sdk_go.OryIdpSettings {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.OryIdpSettings{
		ProjectSlug: ptrutil.Ptr(src.ProjectSlug),
		ApiKey:      ptrutil.Ptr(strutil.Mask(src.ApiKey)),
	}
}

func ToOryIdpSettings(
	src *identity_service_sdk_go.OryIdpSettings,
) *settingstypes.OryIdpSettings {
	if src == nil {
		return nil
	}

	return &settingstypes.OryIdpSettings{
		ProjectSlug: src.GetProjectSlug(),
		ApiKey:      src.GetApiKey(),
	}
}

func FromIssuerSettings(
	src *settingstypes.IssuerSettings,
) *identity_service_sdk_go.IssuerSettings {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.IssuerSettings{
		IdpType:         ptrutil.Ptr(identity_service_sdk_go.IdpType(src.IdpType)),
		OktaIdpSettings: FromOktaIdpSettings(src.OktaIdpSettings),
		DuoIdpSettings:  FromDuoIdpSettings(src.DuoIdpSettings),
		OryIdpSettings:  FromOryIdpSettings(src.OryIdpSettings),
	}
}

func ToIssuerSettings(
	src *identity_service_sdk_go.IssuerSettings,
) *settingstypes.IssuerSettings {
	if src == nil {
		return nil
	}

	return &settingstypes.IssuerSettings{
		IdpType:         settingstypes.IdpType(src.GetIdpType()),
		OktaIdpSettings: ToOktaIdpSettings(src.GetOktaIdpSettings()),
		DuoIdpSettings:  ToDuoIdpSettings(src.GetDuoIdpSettings()),
		OryIdpSettings:  ToOryIdpSettings(src.GetOryIdpSettings()),
	}
}

func FromApiKey(
	src *settingstypes.ApiKey,
) *identity_service_sdk_go.ApiKey {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.ApiKey{
		ApiKey: ptrutil.Ptr(src.ApiKey),
	}
}
