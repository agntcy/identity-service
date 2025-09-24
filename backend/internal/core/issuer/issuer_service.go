// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Issuerentifier: Apache-2.0

package issuer

import (
	"context"
	"errors"
	"fmt"

	"github.com/outshift/identity-service/internal/core/identity"
	idpcore "github.com/outshift/identity-service/internal/core/idp"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/pkg/log"
)

type Service interface {
	SetIssuer(ctx context.Context, issuerSettings *settingstypes.IssuerSettings) error
}

type service struct {
	identityService identity.Service
	idpFactory      idpcore.IdpFactory
	credentialStore idpcore.CredentialStore
}

func NewService(
	identityService identity.Service,
	idpFactory idpcore.IdpFactory,
	credentialStore idpcore.CredentialStore,
) Service {
	return &service{
		identityService: identityService,
		idpFactory:      idpFactory,
		credentialStore: credentialStore,
	}
}

func (s *service) SetIssuer(
	ctx context.Context,
	issuerSettings *settingstypes.IssuerSettings,
) error {
	// Validate the issuer settings.
	if issuerSettings == nil {
		return errors.New("issuer settings cannot be nil")
	}

	// Get organization details
	organizationID, ok := identitycontext.GetOrganizationID(ctx)
	if !ok {
		return identitycontext.ErrOrganizationNotFound
	}

	var (
		clientCredentials *idpcore.ClientCredentials
		idp               idpcore.Idp
	)

	idp, err := s.idpFactory.Create(ctx, issuerSettings)
	if err != nil {
		return fmt.Errorf("idp factory in SetIssuer failed to create an IdP instance: %w", err)
	}

	clientCredentials, err = idp.CreateClientCredentialsPair(ctx)
	if err != nil {
		return fmt.Errorf("idp in SetIssuer failed to create client credentials pair: %w", err)
	}

	defer func() {
		// Clean up client credentials if they were created.
		if err != nil && clientCredentials != nil {
			s.DeleteClientCredentialsPair(ctx, idp, clientCredentials)
		}
	}()

	err = s.credentialStore.Put(ctx, clientCredentials, clientCredentials.ClientID)
	if err != nil {
		return fmt.Errorf(
			"credential store in SetIssuer failed to store client credentials %s: %w",
			clientCredentials.ClientID,
			err,
		)
	}

	// Register the issuer with the identity service.
	issuer, err := s.identityService.RegisterIssuer(
		ctx,
		clientCredentials,
		organizationID,
	)
	if err != nil {
		// Clean up client credentials if they were created.
		if clientCredentials != nil {
			s.DeleteClientCredentialsPair(ctx, idp, clientCredentials)
		}

		return fmt.Errorf("identity service in SetIssuer failed to register issuer: %w", err)
	}

	// Set the issuer ID and key ID in the issuer settings.
	issuerSettings.IssuerID = issuer.CommonName
	issuerSettings.KeyID = issuer.KeyID

	return nil
}

func (s *service) DeleteClientCredentialsPair(
	ctx context.Context,
	idp idpcore.Idp,
	clientCredentials *idpcore.ClientCredentials,
) {
	err := idp.DeleteClientCredentialsPair(ctx, clientCredentials)
	if err != nil {
		log.FromContext(ctx).
			WithError(err).
			Error("idp in SetIssuer failed to delete client credentials pair")
	}
}
