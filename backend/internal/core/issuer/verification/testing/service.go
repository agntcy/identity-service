// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package testing

import (
	"context"

	issuertypes "github.com/agntcy/identity-platform/internal/core/issuer/types"
	"github.com/agntcy/identity-platform/internal/core/issuer/verification"
	vctypes "github.com/agntcy/identity-platform/internal/core/vc/types"
)

const (
	ValidProofIssuer string = "ISSUER"
	ValidProofSub    string = "SUBJECT"
)

type FakeVerifiedVerificationService struct{}

func NewFakeVerifiedVerificationService() verification.Service {
	return &FakeVerifiedVerificationService{}
}

func (f *FakeVerifiedVerificationService) Verify(
	ctx context.Context,
	issuer *issuertypes.Issuer,
	proof *vctypes.Proof,
) (bool, error) {
	return true, nil
}

type FakeUnverifiedVerificationServiceStub struct{}

func NewFakeUnverifiedVerificationServiceStub() verification.Service {
	return &FakeUnverifiedVerificationServiceStub{}
}

func (f *FakeUnverifiedVerificationServiceStub) Verify(
	ctx context.Context,
	issuer *issuertypes.Issuer,
	proof *vctypes.Proof,
) (bool, error) {
	return false, nil
}
