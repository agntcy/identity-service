// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package grpc

import (
	"context"
	"fmt"

	issuerapi "github.com/agntcy/identity-platform/api/server/agntcy/identity-platform/issuer/v1alpha1"
	"google.golang.org/protobuf/types/known/emptypb"
)

type localService struct{}

func NewLocalService() issuerapi.LocalServiceServer {
	return &localService{}
}

// Generate a keypair in Json Web Key (JWK) format
func (l *localService) KeyGen(
	ctx context.Context,
	req *emptypb.Empty,
) (*issuerapi.KeyGenResponse, error) {
	return nil, fmt.Errorf("not implemented")
}

// Issue a Verifiable Credential in a specific Envelope Type
func (l *localService) IssueVC(
	ctx context.Context,
	req *issuerapi.IssueVCRequest,
) (*issuerapi.IssueVCResponse, error) {
	return nil, fmt.Errorf("not implemented")
}
