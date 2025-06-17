// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Issuerentifier: Apache-2.0

package issuer

import (
	"context"
	"fmt"

	"github.com/agntcy/identity-platform/internal/core/identity"
	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	settingstypes "github.com/agntcy/identity-platform/internal/core/settings/types"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
)

type Service interface {
	SetIssuer(ctx context.Context, issuerSettings *settingstypes.IssuerSettings) error
}

type service struct {
	identityService identity.Service
}

func NewService(
	identityService identity.Service,
) Service {
	return &service{
		identityService: identityService,
	}
}

func (s *service) SetIssuer(
	ctx context.Context,
	issuerSettings *settingstypes.IssuerSettings,
) error {
	// Validate the issuer settings.
	if issuerSettings == nil {
		return errutil.Err(nil, "issuer settings cannot be nil")
	}

	// Get common name from the issuer settings if not set.
	userID, ok := identitycontext.GetUserID(ctx)
	if !ok {
		return fmt.Errorf("user id not found in context")
	}

	// Get organization details
	organizationID, ok := identitycontext.GetOrganizationID(ctx)
	if !ok {
		return fmt.Errorf("organization id not found in context")
	}

	var clientCredentials *idpcore.ClientCredentials
	var idp idpcore.Idp

	// For some IDP types, we need to create client credentials.
	if issuerSettings.IdpType != settingstypes.IDP_TYPE_SELF {
		var err error

		// Create a new IDP instance based on the issuer settings.
		idp, err = idpcore.NewIdp(ctx, issuerSettings)
		if err != nil {
			return errutil.Err(err, "failed to create IDP instance")
		}

		clientCredentials, err = idp.CreateClientCredentialsPair(ctx)
		if err != nil {
			return errutil.Err(err, "failed to create client credentials pair")
		}
	}

	// Register the issuer with the identity service.
	issuer, err := s.identityService.RegisterIssuer(
		ctx,
		clientCredentials,
		userID,
		organizationID,
	)
	if err != nil {
		// Clean up client credentials if they were created.
		if clientCredentials != nil {
			_ = idp.DeleteClientCredentialsPair(ctx, clientCredentials)
		}

		return errutil.Err(err, "failed to register issuer")
	}

	// Set the issuer ID and key ID in the issuer settings.
	issuerSettings.IssuerID = issuer.CommonName
	issuerSettings.KeyID = issuer.KeyID

	return nil
}
