// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package identity

import (
	"context"
	"fmt"
	"net"
	"os"

	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/httputil"
	"github.com/agntcy/identity-platform/pkg/log"
	issuersdk "github.com/agntcy/identity/api/client/client/issuer_service"
	identitymodels "github.com/agntcy/identity/api/client/models"
	"github.com/agntcy/identity/pkg/joseutil"
	"github.com/agntcy/identity/pkg/jwk"
	"github.com/agntcy/identity/pkg/keystore"
	"github.com/agntcy/identity/pkg/oidc"
	httptransport "github.com/go-openapi/runtime/client"
	"github.com/go-openapi/strfmt"
	"github.com/google/uuid"
)

const (
	keyBasePathPrefix = "key-"
	proofTypeJWT      = "JWT"
)

type Issuer struct {
	CommonName string
	KeyID      string
}

type Service interface {
	RegisterIssuer(
		ctx context.Context,
		clientCredentials *idpcore.ClientCredentials,
		userID, organizationID string,
	) (*Issuer, error)
}

// The verificationService struct implements the VerificationService interface
type service struct {
	vaultAddress      string
	issuerClient      issuersdk.ClientService
	oidcAuthenticator oidc.Authenticator
	goEnv             string
}

// NewVerificationService creates a new instance of the VerificationService
func NewService(
	vaultHost, vaultPort string,
	vaultUseSSL bool,
	identityHost, identityPort string,
	goEnv string,
) Service {
	// Get protocol
	vaultProtocol := "http:"
	if vaultUseSSL {
		vaultProtocol = "https:"
	}

	return &service{
		vaultAddress: fmt.Sprintf("%s//%s", vaultProtocol, net.JoinHostPort(vaultHost, vaultPort)),
		issuerClient: issuersdk.New(
			httptransport.New(
				net.JoinHostPort(identityHost, identityPort),
				"",
				nil,
			),
			strfmt.Default,
		),
		oidcAuthenticator: oidc.NewAuthenticator(),
		goEnv:             goEnv,
	}
}

func (s *service) RegisterIssuer(
	ctx context.Context,
	clientCredentials *idpcore.ClientCredentials, userID, organizationID string,
) (*Issuer, error) {
	// Generate a new key for the issuer
	key, err := s.generateAndSaveKey(ctx)
	if err != nil || key == nil {
		return nil, errutil.Err(
			err,
			"error generating and saving key for issuer",
		)
	}

	// Get common name for the issuer
	commonName := s.getCommonName(clientCredentials, userID)

	// Prepare the issuer registration parameters
	issuer := &identitymodels.V1alpha1Issuer{
		Organization: organizationID,
		CommonName:   commonName,
		PublicKey: &identitymodels.V1alpha1Jwk{
			Alg: key.ALG,
			Kty: key.KTY,
			Use: key.USE,
			Kid: key.KID,
			Pub: key.PUB,
			E:   key.E,
			N:   key.N,
		},
	}

	// Prepare the proof
	proof, err := s.generateProof(ctx, clientCredentials, userID, key.KID)
	if err != nil {
		return nil, errutil.Err(
			err,
			"error generating proof for issuer registration",
		)
	}

	log.Debug("Registering issuer with common name: ", commonName)
	log.Debug("Using issuer: ", issuer)
	log.Debug("Using proof: ", proof)

	// Perform the registration with the identity service
	_, err = s.issuerClient.RegisterIssuer(&issuersdk.RegisterIssuerParams{
		Body: &identitymodels.V1alpha1RegisterIssuerRequest{
			Issuer: issuer,
			Proof:  proof,
		},
	})
	if err != nil {
		return nil, errutil.Err(
			err,
			"error registering issuer with identity service",
		)
	}

	return &Issuer{
		CommonName: commonName,
		KeyID:      key.KID,
	}, nil
}

func (s *service) getCommonName(
	clientCredentials *idpcore.ClientCredentials,
	commonName string,
) string {
	if clientCredentials != nil {
		return httputil.Hostname(clientCredentials.Issuer)
	}

	return commonName
}

func (s *service) generateProof(
	ctx context.Context,
	clientCredentials *idpcore.ClientCredentials,
	commonName string,
	keyId string,
) (*identitymodels.V1alpha1Proof, error) {
	proof := &identitymodels.V1alpha1Proof{
		Type: proofTypeJWT,
	}

	var proofValue string
	var err error

	// If client credentials are provided, use them to generate the proof
	if clientCredentials != nil {
		proofValue, err = s.oidcAuthenticator.Token(
			ctx,
			clientCredentials.Issuer,
			clientCredentials.ClientID,
			clientCredentials.ClientSecret,
		)
	} else {
		// Retrieve the private key from the vault
		vaultService, vaultErr := s.connectVault(ctx)
		if vaultErr != nil {
			return nil, errutil.Err(
				vaultErr,
				"error connecting to vault for proof generation",
			)
		}

		privKey, keyErr := vaultService.RetrievePrivKey(ctx, keyId)
		if keyErr != nil {
			return nil, errutil.Err(
				keyErr,
				"error retrieving private key from vault for proof generation",
			)
		}

		// Issue a self-signed JWT proof
		proofValue, err = oidc.SelfIssueJWT(
			commonName,
			uuid.NewString(),
			privKey,
		)
	}

	if err != nil {
		return nil, errutil.Err(
			err,
			"error generating proof for issuer registration",
		)
	}

	// Set the proof value
	proof.ProofValue = proofValue

	return proof, nil
}

func (s *service) generateAndSaveKey(ctx context.Context) (*jwk.Jwk, error) {
	// Connect to the vault
	vaultService, err := s.connectVault(ctx)
	if err != nil {
		return nil, err
	}

	// Generate a new key
	keyId := uuid.NewString()

	priv, err := joseutil.GenerateJWK("RS256", "sig", keyId)
	if err != nil {
		return nil, fmt.Errorf("error generating JWK: %w", err)
	}

	err = vaultService.SaveKey(ctx, priv.KID, priv)
	if err != nil {
		return nil, fmt.Errorf("error saving key: %w", err)
	}

	log.Debug("Saving new key for issuer: ", priv.KID)

	return priv.PublicKey(), nil
}

func (s *service) connectVault(ctx context.Context) (keystore.KeyService, error) {
	// Get the token depending on the environment
	token := ""
	if s.goEnv != "production" {
		// In dev mode, we use the root token
		token = os.Getenv("VAULT_DEV_ROOT_TOKEN")
	}

	// Get the tenant ID from the context
	tenantId, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, fmt.Errorf("tenant ID not found in context")
	}

	// Create key base path
	keyBasePath := fmt.Sprintf("%s/%s", keyBasePathPrefix, tenantId)

	// Create config
	config := keystore.VaultStorageConfig{
		Address:     s.vaultAddress,
		Token:       token, // This should be set in dev mode only
		MountPath:   "secret",
		KeyBasePath: keyBasePath,
	}

	return keystore.NewKeyService(keystore.VaultStorage, config)
}
