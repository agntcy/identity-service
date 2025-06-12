// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package issuer

import (
	"context"

	vctypes "github.com/agntcy/identity-saas/internal/core/vc/types"
	"github.com/agntcy/identity-saas/internal/issuer/auth"
	"github.com/agntcy/identity-saas/internal/issuer/issuer/data"
	"github.com/agntcy/identity-saas/internal/issuer/issuer/types"
	"github.com/agntcy/identity-saas/internal/pkg/nodeapi"
)

type IssuerService interface {
	RegisterIssuer(ctx context.Context, vaultId, keyId string, issuer *types.Issuer) (string, error)
	GetAllIssuers(vaultId, keyId string) ([]*types.Issuer, error)
	GetIssuer(vaultId, keyId, issuerId string) (*types.Issuer, error)
	ForgetIssuer(vaultId, keyId, issuerId string) error
}

type issuerService struct {
	issuerRepository data.IssuerRepository
	nodeClientPrv    nodeapi.ClientProvider
	authClient       auth.Client
}

func NewIssuerService(
	issuerRepository data.IssuerRepository,
	nodeClientPrv nodeapi.ClientProvider,
	authClient auth.Client,
) IssuerService {
	return &issuerService{
		issuerRepository: issuerRepository,
		nodeClientPrv:    nodeClientPrv,
		authClient:       authClient,
	}
}

func (s *issuerService) RegisterIssuer(
	ctx context.Context,
	vaultId, keyId string,
	issuer *types.Issuer,
) (string, error) {
	token, err := s.authClient.Token(
		ctx,
		vaultId,
		keyId,
		issuer,
		issuer.IdpConfig, &issuer.ID)
	if err != nil {
		return "", err
	}

	proof := vctypes.Proof{
		Type:       "JWT",
		ProofValue: token,
	}

	client, err := s.nodeClientPrv.New(issuer.IdentityNodeURL)
	if err != nil {
		return "", err
	}

	err = client.RegisterIssuer(ctx, &issuer.Issuer, &proof)
	if err != nil {
		return "", err
	}

	issuerId, err := s.issuerRepository.AddIssuer(vaultId, keyId, issuer)
	if err != nil {
		return "", err
	}

	return issuerId, nil
}

func (s *issuerService) GetAllIssuers(vaultId, keyId string) ([]*types.Issuer, error) {
	issuers, err := s.issuerRepository.GetAllIssuers(vaultId, keyId)
	if err != nil {
		return nil, err
	}

	return issuers, nil
}

func (s *issuerService) GetIssuer(vaultId, keyId, issuerId string) (*types.Issuer, error) {
	issuer, err := s.issuerRepository.GetIssuer(vaultId, keyId, issuerId)
	if err != nil {
		return nil, err
	}

	return issuer, nil
}

func (s *issuerService) ForgetIssuer(vaultId, keyId, issuerId string) error {
	err := s.issuerRepository.RemoveIssuer(vaultId, keyId, issuerId)
	if err != nil {
		return err
	}

	return nil
}
