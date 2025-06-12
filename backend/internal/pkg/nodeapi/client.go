// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package nodeapi

import (
	"context"
	"errors"
	"net/url"

	idsdk "github.com/agntcy/identity-platform/api/client/client/id_service"
	issuersdk "github.com/agntcy/identity-platform/api/client/client/issuer_service"
	vcsdk "github.com/agntcy/identity-platform/api/client/client/vc_service"
	apimodels "github.com/agntcy/identity-platform/api/client/models"
	idtypes "github.com/agntcy/identity-platform/internal/core/id/types"
	issuertypes "github.com/agntcy/identity-platform/internal/core/issuer/types"
	vctypes "github.com/agntcy/identity-platform/internal/core/vc/types"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	httptransport "github.com/go-openapi/runtime/client"
	"github.com/go-openapi/strfmt"
)

type ClientProvider interface {
	New(host string) (NodeClient, error)
}

type clientProvider struct{}

func NewNodeClientProvider() ClientProvider {
	return &clientProvider{}
}

func (clientProvider) New(host string) (NodeClient, error) {
	return NewNodeClient(host)
}

type NodeClient interface {
	RegisterIssuer(
		ctx context.Context,
		issuer *issuertypes.Issuer,
		proof *vctypes.Proof,
	) error
	GenerateID(
		ctx context.Context,
		issuer *issuertypes.Issuer,
		proof *vctypes.Proof,
	) (*idtypes.ResolverMetadata, error)
	PublishVerifiableCredential(
		vc *vctypes.EnvelopedCredential,
		proof *vctypes.Proof,
	) error
	ResolveMetadataByID(
		ctx context.Context,
		id string,
	) (*idtypes.ResolverMetadata, error)
}

type nodeClient struct {
	id     idsdk.ClientService
	issuer issuersdk.ClientService
	vc     vcsdk.ClientService
}

func NewNodeClient(host string) (NodeClient, error) {
	u, err := url.Parse(host)
	if err != nil {
		return nil, err
	}

	return &nodeClient{
		id:     idsdk.New(httptransport.New(u.Host, "", []string{u.Scheme}), strfmt.Default),
		issuer: issuersdk.New(httptransport.New(u.Host, "", []string{u.Scheme}), strfmt.Default),
		vc:     vcsdk.New(httptransport.New(u.Host, "", []string{u.Scheme}), strfmt.Default),
	}, nil
}

func (c *nodeClient) RegisterIssuer(
	ctx context.Context,
	issuer *issuertypes.Issuer,
	proof *vctypes.Proof,
) error {
	_, err := c.issuer.RegisterIssuer(&issuersdk.RegisterIssuerParams{
		Body: &apimodels.V1alpha1RegisterIssuerRequest{
			Issuer: &apimodels.V1alpha1Issuer{
				CommonName:      issuer.CommonName,
				Organization:    issuer.Organization,
				SubOrganization: issuer.SubOrganization,
				PublicKey: convertutil.Convert[apimodels.V1alpha1Jwk](
					issuer.PublicKey.PublicKey(),
				),
			},
			Proof: &apimodels.V1alpha1Proof{
				Type:       proof.Type,
				ProofValue: proof.ProofValue,
			},
		},
	})
	if err != nil {
		return err
	}

	return nil
}

func (c *nodeClient) GenerateID(
	ctx context.Context,
	issuer *issuertypes.Issuer,
	proof *vctypes.Proof,
) (*idtypes.ResolverMetadata, error) {
	resp, err := c.id.GenerateID(&idsdk.GenerateIDParams{
		Body: &apimodels.V1alpha1GenerateRequest{
			Issuer: &apimodels.V1alpha1Issuer{
				CommonName:      issuer.CommonName,
				Organization:    issuer.Organization,
				SubOrganization: issuer.SubOrganization,
				PublicKey: convertutil.Convert[apimodels.V1alpha1Jwk](
					issuer.PublicKey.PublicKey(),
				),
			},
			Proof: &apimodels.V1alpha1Proof{
				Type:       proof.Type,
				ProofValue: proof.ProofValue,
			},
		},
	})
	if err != nil {
		return nil, err
	}

	if resp == nil || resp.Payload == nil || resp.Payload.ResolverMetadata == nil {
		return nil, errors.New("empty response payload")
	}

	md := resp.Payload.ResolverMetadata

	return &idtypes.ResolverMetadata{
		ID: md.ID,
		VerificationMethod: convertutil.ConvertSlice(
			md.VerificationMethod,
			func(vm *apimodels.V1alpha1VerificationMethod) *idtypes.VerificationMethod {
				return &idtypes.VerificationMethod{
					ID:           vm.ID,
					PublicKeyJwk: convertutil.Convert[idtypes.Jwk](vm.PublicKeyJwk),
				}
			},
		),
		Service: convertutil.ConvertSlice(
			md.Service,
			func(s *apimodels.V1alpha1Service) *idtypes.Service {
				return &idtypes.Service{
					ServiceEndpoint: s.ServiceEndpoint,
				}
			},
		),
		AssertionMethod: md.AssertionMethod,
	}, nil
}

func (c *nodeClient) PublishVerifiableCredential(
	vc *vctypes.EnvelopedCredential,
	proof *vctypes.Proof,
) error {
	resp, err := c.vc.PublishVerifiableCredential(&vcsdk.PublishVerifiableCredentialParams{
		Body: &apimodels.V1alpha1PublishRequest{
			Vc: &apimodels.V1alpha1EnvelopedCredential{
				EnvelopeType: apimodels.NewV1alpha1CredentialEnvelopeType(
					apimodels.V1alpha1CredentialEnvelopeType(vc.EnvelopeType.String()),
				),
				Value: vc.Value,
			},
			Proof: &apimodels.V1alpha1Proof{
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

func (c *nodeClient) ResolveMetadataByID(
	ctx context.Context,
	id string,
) (*idtypes.ResolverMetadata, error) {
	resp, err := c.id.ResolveID(&idsdk.ResolveIDParams{
		Body: &apimodels.V1alpha1ResolveRequest{
			ID: id,
		},
	})
	if err != nil {
		return nil, err
	}

	if resp == nil || resp.Payload == nil || resp.Payload.ResolverMetadata == nil {
		return nil, errors.New("empty response payload")
	}

	md := resp.Payload.ResolverMetadata

	return &idtypes.ResolverMetadata{
		ID: md.ID,
		VerificationMethod: convertutil.ConvertSlice(
			md.VerificationMethod,
			func(vm *apimodels.V1alpha1VerificationMethod) *idtypes.VerificationMethod {
				return &idtypes.VerificationMethod{
					ID:           vm.ID,
					PublicKeyJwk: convertutil.Convert[idtypes.Jwk](vm.PublicKeyJwk),
				}
			},
		),
		Service: convertutil.ConvertSlice(
			md.Service,
			func(s *apimodels.V1alpha1Service) *idtypes.Service {
				return &idtypes.Service{
					ServiceEndpoint: s.ServiceEndpoint,
				}
			},
		),
		AssertionMethod: md.AssertionMethod,
	}, nil
}
