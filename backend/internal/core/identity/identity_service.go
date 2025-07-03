// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package identity

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"

	badgetypes "github.com/agntcy/identity-platform/internal/core/badge/types"
	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/httputil"
	"github.com/agntcy/identity-platform/internal/pkg/jwtutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/pkg/log"
	idsdk "github.com/agntcy/identity/api/client/client/id_service"
	issuersdk "github.com/agntcy/identity/api/client/client/issuer_service"
	vcsdk "github.com/agntcy/identity/api/client/client/vc_service"
	identitymodels "github.com/agntcy/identity/api/client/models"
	identitysrv "github.com/agntcy/identity/api/server/agntcy/identity/core/v1alpha1"
	"github.com/agntcy/identity/pkg/oidc"
	httptransport "github.com/go-openapi/runtime/client"
	"github.com/go-openapi/strfmt"
	"github.com/google/uuid"
)

const (
	proofTypeJWT      = "JWT"
	credentialSubject = "credentialSubject"
)

type Issuer struct {
	CommonName string
	KeyID      string
}

type Service interface {
	RegisterIssuer(
		ctx context.Context,
		clientCredentials *idpcore.ClientCredentials,
		organizationID string,
	) (*Issuer, error)
	GenerateID(
		ctx context.Context,
		clientCredentials *idpcore.ClientCredentials,
		issuer *Issuer,
	) (string, error)
	PublishVerifiableCredential(
		ctx context.Context,
		clientCredentials *idpcore.ClientCredentials,
		vc *badgetypes.VerifiableCredential,
		issuer *Issuer,
	) error
	VerifyVerifiableCredential(
		ctx context.Context,
		vc *string,
	) (*badgetypes.BadgeClaims, error)
	RevokeVerifiableCredential(
		ctx context.Context,
		clientCredentials *idpcore.ClientCredentials,
		vc *badgetypes.VerifiableCredential,
		issuer *Issuer,
	) error
}

// The verificationService struct implements the VerificationService interface
type service struct {
	issuerClient      issuersdk.ClientService
	idClient          idsdk.ClientService
	vcClient          vcsdk.ClientService
	oidcAuthenticator oidc.Authenticator
	keyStore          KeyStore
}

// NewVerificationService creates a new instance of the VerificationService
func NewService(
	identityHost, identityPort string,
	keyStore KeyStore,
	oidcAuthenticator oidc.Authenticator,
) Service {
	transport := httptransport.New(
		net.JoinHostPort(identityHost, identityPort),
		"",
		nil,
	)

	return &service{
		issuerClient:      issuersdk.New(transport, strfmt.Default),
		idClient:          idsdk.New(transport, strfmt.Default),
		vcClient:          vcsdk.New(transport, strfmt.Default),
		oidcAuthenticator: oidcAuthenticator,
		keyStore:          keyStore,
	}
}

func (s *service) RegisterIssuer(
	ctx context.Context,
	clientCredentials *idpcore.ClientCredentials, organizationID string,
) (*Issuer, error) {
	// Generate a new key for the issuer
	key, err := s.keyStore.GenerateAndSaveKey(ctx)
	if err != nil || key == nil {
		return nil, errutil.Err(
			err,
			"error generating and saving key for issuer",
		)
	}

	// Get common name for the issuer
	commonName := s.getCommonName(clientCredentials)

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
	proof, err := s.generateProof(ctx, clientCredentials, key.KID)
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

func (s *service) GenerateID(
	ctx context.Context,
	clientCredentials *idpcore.ClientCredentials,
	issuer *Issuer,
) (string, error) {
	proof, err := s.generateProof(ctx, clientCredentials, issuer.KeyID)
	if err != nil {
		return "", errutil.Err(
			err,
			"error generating proof for ID generation",
		)
	}

	resp, err := s.idClient.GenerateID(&idsdk.GenerateIDParams{
		Body: &identitymodels.V1alpha1GenerateRequest{
			Issuer: &identitymodels.V1alpha1Issuer{
				CommonName: issuer.CommonName,
			},
			Proof: proof,
		},
	})
	if err != nil {
		return "", err
	}

	if resp == nil || resp.Payload == nil || resp.Payload.ResolverMetadata == nil {
		return "", errors.New("empty response payload")
	}

	return resp.Payload.ResolverMetadata.ID, nil
}

func (s *service) PublishVerifiableCredential(
	ctx context.Context,
	clientCredentials *idpcore.ClientCredentials,
	vc *badgetypes.VerifiableCredential,
	issuer *Issuer,
) error {
	proof, err := s.generateProof(ctx, clientCredentials, issuer.KeyID)
	if err != nil {
		return fmt.Errorf(
			"error generating proof for verifiable credential publishing: %w",
			err,
		)
	}

	var envelope *identitymodels.V1alpha1EnvelopedCredential

	if vc.Proof.IsJOSE() {
		envelope = &identitymodels.V1alpha1EnvelopedCredential{
			EnvelopeType: identitymodels.NewV1alpha1CredentialEnvelopeType(
				identitymodels.V1alpha1CredentialEnvelopeTypeCREDENTIALENVELOPETYPEJOSE,
			),
			Value: vc.Proof.ProofValue,
		}
	} else {
		data, err := json.Marshal(vc)
		if err != nil {
			return fmt.Errorf("unable to marshal verifiable credential: %w", err)
		}

		envelope = &identitymodels.V1alpha1EnvelopedCredential{
			EnvelopeType: identitymodels.NewV1alpha1CredentialEnvelopeType(
				identitymodels.V1alpha1CredentialEnvelopeTypeCREDENTIALENVELOPETYPEEMBEDDEDPROOF,
			),
			Value: string(data),
		}
	}

	resp, err := s.vcClient.PublishVerifiableCredential(&vcsdk.PublishVerifiableCredentialParams{
		Body: &identitymodels.V1alpha1PublishRequest{
			Vc: envelope,
			Proof: &identitymodels.V1alpha1Proof{
				Type:       proof.Type,
				ProofValue: proof.ProofValue,
			},
		},
	})
	if err != nil {
		return err
	}

	if resp == nil {
		return errors.New("empty response payload")
	}

	return nil
}

func (s *service) getCommonName(
	clientCredentials *idpcore.ClientCredentials,
) string {
	if clientCredentials.ClientSecret != "" {
		return httputil.Hostname(clientCredentials.Issuer)
	}

	return clientCredentials.Issuer
}

func (s *service) generateProof(
	ctx context.Context,
	clientCredentials *idpcore.ClientCredentials,
	keyId string,
) (*identitymodels.V1alpha1Proof, error) {
	proof := &identitymodels.V1alpha1Proof{
		Type: proofTypeJWT,
	}

	var proofValue string
	var err error

	// If client credentials are provided, use them to generate the proof
	if clientCredentials.ClientSecret != "" {
		proofValue, err = s.oidcAuthenticator.Token(
			ctx,
			clientCredentials.Issuer,
			clientCredentials.ClientID,
			clientCredentials.ClientSecret,
		)
	} else {
		privKey, keyErr := s.keyStore.RetrievePrivKey(ctx, keyId)
		if keyErr != nil {
			return nil, errutil.Err(
				keyErr,
				"error retrieving private key from vault for proof generation",
			)
		}

		// Issue a self-signed JWT proof
		proofValue, err = oidc.SelfIssueJWT(
			clientCredentials.Issuer,
			uuid.NewString(), // TODO: This needs to be configurable when creating VCs
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

func (s *service) VerifyVerifiableCredential(
	ctx context.Context,
	vc *string,
) (*badgetypes.BadgeClaims, error) {
	if vc == nil || *vc == "" {
		return nil, errors.New("verifiable credential is empty")
	}

	// Verify the proof of the verifiable credential
	_, err := s.vcClient.VerifyVerifiableCredential(&vcsdk.VerifyVerifiableCredentialParams{
		Body: &identitymodels.V1alpha1VerifyRequest{
			Vc: &identitymodels.V1alpha1EnvelopedCredential{
				EnvelopeType: ptrutil.Ptr(
					identitymodels.V1alpha1CredentialEnvelopeTypeCREDENTIALENVELOPETYPEJOSE,
				),
				Value: *vc,
			},
		},
	})
	if err != nil {
		return nil, errutil.Err(
			err,
			"error verifying verifiable credential",
		)
	}

	log.Debug("Verifiable credential verified successfully")

	// Parse the verifiable credential to extract claims
	claimValue, err := jwtutil.GetClaim(
		vc,
		credentialSubject,
	)
	if err != nil {
		return nil, errutil.Err(
			err,
			"error extracting credential subject from verifiable credential",
		)
	}

	log.Debug("Extracted credential subject: ", *claimValue)

	// Unmarshal the claims from the credential subject
	var claims badgetypes.BadgeClaims
	err = json.Unmarshal([]byte(*claimValue), &claims)

	log.Debug("Unmarshalled claims: ", claims)

	return &claims, err
}

func (s *service) RevokeVerifiableCredential(
	ctx context.Context,
	clientCredentials *idpcore.ClientCredentials,
	vc *badgetypes.VerifiableCredential,
	issuer *Issuer,
) error {
	proof, err := s.generateProof(ctx, clientCredentials, issuer.KeyID)
	if err != nil {
		return fmt.Errorf(
			"error generating proof for verifiable credential publishing: %w",
			err,
		)
	}

	var envelope *identitymodels.V1alpha1EnvelopedCredential

	if vc.Proof.IsJOSE() {
		envelope = &identitymodels.V1alpha1EnvelopedCredential{
			EnvelopeType: identitymodels.NewV1alpha1CredentialEnvelopeType(
				identitymodels.V1alpha1CredentialEnvelopeTypeCREDENTIALENVELOPETYPEJOSE,
			),
			Value: vc.Proof.ProofValue,
		}
	} else {
		data, err := json.Marshal(vc)
		if err != nil {
			return fmt.Errorf("unable to marshal verifiable credential: %w", err)
		}

		envelope = &identitymodels.V1alpha1EnvelopedCredential{
			EnvelopeType: identitymodels.NewV1alpha1CredentialEnvelopeType(
				identitymodels.V1alpha1CredentialEnvelopeTypeCREDENTIALENVELOPETYPEEMBEDDEDPROOF,
			),
			Value: string(data),
		}
	}

	_, err = s.vcClient.RevokeVerifiableCredential(&vcsdk.RevokeVerifiableCredentialParams{
		Body: &identitymodels.V1alpha1RevokeRequest{
			Vc: envelope,
			Proof: &identitymodels.V1alpha1Proof{
				Type:       proof.Type,
				ProofValue: proof.ProofValue,
			},
		},
	})
	if err != nil {
		err := tryGetErrorInfo(err)

		var errInfo ErrorInfo
		if errors.As(err, &errInfo) {
			if errInfo.Reason == identitysrv.ErrorReason_ERROR_REASON_VERIFIABLE_CREDENTIAL_REVOKED {
				// it's already revoked, not exactly an error
				return nil
			}
		}

		return err
	}

	return nil
}

func tryGetErrorInfo(err error) error {
	apiErr := vcsdk.NewRevokeVerifiableCredentialDefault(0)
	if errors.As(err, &apiErr) {
		payload := apiErr.GetPayload()
		for _, detail := range payload.Details {
			if reason, ok := detail.GoogleprotobufAny["reason"]; ok {
				return ErrorInfo{
					Reason: identitysrv.ErrorReason(identitysrv.ErrorReason_value[reason.(string)]),
				}
			}
		}
	}

	return err
}
