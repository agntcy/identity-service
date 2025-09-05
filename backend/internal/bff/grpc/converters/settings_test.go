// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters_test

import (
	"testing"

	"github.com/google/uuid"
	identity_service_sdk_go "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
	"github.com/outshift/identity-service/internal/bff/grpc/converters"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
)

func TestFromOktaIdpSettings(t *testing.T) {
	t.Parallel()

	src := &settingstypes.OktaIdpSettings{
		OrgUrl:     uuid.NewString(),
		ClientID:   uuid.NewString(),
		PrivateKey: "something",
	}

	dst := converters.FromOktaIdpSettings(src)

	assert.Equal(t, &identity_service_sdk_go.OktaIdpSettings{
		OrgUrl:     &src.OrgUrl,
		ClientId:   &src.ClientID,
		PrivateKey: ptrutil.Ptr("*****thing"),
	}, dst)
}

func TestFromDuoIdpSettings(t *testing.T) {
	t.Parallel()

	src := &settingstypes.DuoIdpSettings{
		Hostname:       uuid.NewString(),
		IntegrationKey: uuid.NewString(),
		SecretKey:      "something",
	}

	dst := converters.FromDuoIdpSettings(src)

	assert.Equal(t, &identity_service_sdk_go.DuoIdpSettings{
		Hostname:       &src.Hostname,
		IntegrationKey: &src.IntegrationKey,
		SecretKey:      ptrutil.Ptr("*****thing"),
	}, dst)
}

func TestFromOryIdpSettings(t *testing.T) {
	t.Parallel()

	src := &settingstypes.OryIdpSettings{
		ProjectSlug: uuid.NewString(),
		ApiKey:      "something",
	}

	dst := converters.FromOryIdpSettings(src)

	assert.Equal(t, &identity_service_sdk_go.OryIdpSettings{
		ProjectSlug: &src.ProjectSlug,
		ApiKey:      ptrutil.Ptr("*****thing"),
	}, dst)
}
