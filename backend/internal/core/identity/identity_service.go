// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package identity

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"strings"

	badgetypes "github.com/agntcy/identity-platform/internal/core/badge/types"
	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/httputil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/pkg/log"
	idsdk "github.com/agntcy/identity/api/client/client/id_service"
	issuersdk "github.com/agntcy/identity/api/client/client/issuer_service"
	vcsdk "github.com/agntcy/identity/api/client/client/vc_service"
	identitymodels "github.com/agntcy/identity/api/client/models"
	"github.com/agntcy/identity/pkg/oidc"
	httptransport "github.com/go-openapi/runtime/client"
	"github.com/go-openapi/strfmt"
)

const (
	proofTypeJWT      = "JWT"
	credentialSubject = "credentialSubject"
	issuerExistsError = "issuer already exists"
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
	) (*badgetypes.VerificationResult, error)
	RevokeVerifiableCredential(
		ctx context.Context,
		clientCredentials *idpcore.ClientCredentials,
		vc *badgetypes.VerifiableCredential,
		issuer *Issuer,
	) error
}

// The verificationService struct implements the VerificationService interface
type service struct {
	issuerClient          issuersdk.ClientService
	idClient              idsdk.ClientService
	vcClient              vcsdk.ClientService
	oidcAuthenticator     oidc.Authenticator
	keyStore              KeyStore
	uniqueIssuerPerTenant bool
}

// NewVerificationService creates a new instance of the VerificationService
func NewService(
	identityHost, identityPort string,
	keyStore KeyStore,
	oidcAuthenticator oidc.Authenticator,
	uniqueIssuerPerTenant bool,
) Service {
	transport := httptransport.New(
		net.JoinHostPort(identityHost, identityPort),
		"",
		nil,
	)

	return &service{
		issuerClient:          issuersdk.New(transport, strfmt.Default),
		idClient:              idsdk.New(transport, strfmt.Default),
		vcClient:              vcsdk.New(transport, strfmt.Default),
		oidcAuthenticator:     oidcAuthenticator,
		keyStore:              keyStore,
		uniqueIssuerPerTenant: uniqueIssuerPerTenant,
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

	if err != nil &&
		(s.uniqueIssuerPerTenant || !strings.Contains(err.Error(), issuerExistsError)) {
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
		return "", errutil.Err(
			err,
			"error generating ID with identity service",
		)
	}

	if resp == nil || resp.Payload == nil || resp.Payload.ResolverMetadata == nil {
		return "", errutil.Err(
			nil,
			"error generating ID with identity service",
		)
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
			clientCredentials.ClientID,
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
) (*badgetypes.VerificationResult, error) {
	if vc == nil || *vc == "" {
		return nil, errors.New("verifiable credential is empty")
	}

	// Verify the proof of the verifiable credential
	resp, err := s.vcClient.VerifyVerifiableCredential(&vcsdk.VerifyVerifiableCredentialParams{
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

	if resp == nil || resp.Payload == nil {
		return nil, errors.New("empty payload")
	}

	result := resp.Payload

	return &badgetypes.VerificationResult{
		Status:                       result.Status,
		Document:                     convertVerifiableCredential(result.Document),
		MediaType:                    result.MediaType,
		Controller:                   result.Controller,
		ControlledIdentifierDocument: result.ControlledIdentifierDocument,
		Warnings:                     convertutil.ConvertSlice(result.Warnings, convertErroInfo),
		Errors:                       convertutil.ConvertSlice(result.Errors, convertErroInfo),
	}, nil
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
		errInfo, err := tryGetErrorInfo(err)

		if errInfo != nil {
			if *errInfo.Reason == identitymodels.V1alpha1ErrorReasonERRORREASONVERIFIABLECREDENTIALREVOKED {
				// it's already revoked, not exactly an error
				return nil
			}
		}

		return err
	}

	return nil
}

func tryGetErrorInfo(err error) (*identitymodels.V1alpha1ErrorInfo, error) {
	apiErr := vcsdk.NewRevokeVerifiableCredentialDefault(0)
	if errors.As(err, &apiErr) {
		payload := apiErr.GetPayload()
		for _, detail := range payload.Details {
			if reason, ok := detail.GoogleprotobufAny["reason"]; ok {
				return &identitymodels.V1alpha1ErrorInfo{
					Reason: identitymodels.NewV1alpha1ErrorReason(identitymodels.V1alpha1ErrorReason(reason.(string))),
				}, nil
			}
		}
	}

	return nil, err
}

func convertErroInfo(err *identitymodels.V1alpha1ErrorInfo) *badgetypes.ErrorInfo {
	if err == nil {
		return nil
	}

	reason := ptrutil.Derefrence(err.Reason, identitymodels.V1alpha1ErrorReasonERRORREASONIDALREADYREGISTERED)

	return &badgetypes.ErrorInfo{
		Reason:  string(reason),
		Message: err.Message,
	}
}

func convertVerifiableCredential(
	src *identitymodels.V1alpha1VerifiableCredential,
) *badgetypes.VerifiableCredential {
	if src == nil {
		return nil
	}

	schemas := make([]*badgetypes.CredentialSchema, 0)
	for _, schema := range src.CredentialSchema {
		schemas = append(schemas, convertutil.Convert[badgetypes.CredentialSchema](schema))
	}

	statuses := make([]*badgetypes.CredentialStatus, 0)
	for _, status := range src.CredentialStatus {
		statuses = append(statuses, convertutil.Convert[badgetypes.CredentialStatus](status))
	}

	return &badgetypes.VerifiableCredential{
		Context:           src.Context,
		Type:              src.Type,
		Issuer:            src.Issuer,
		CredentialSubject: convertutil.Convert[badgetypes.BadgeClaims](src.Content),
		ID:                src.ID,
		IssuanceDate:      src.IssuanceDate,
		ExpirationDate:    src.ExpirationDate,
		CredentialSchema:  schemas,
		Status:            statuses,
	}
}
