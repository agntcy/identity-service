// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package issuer

type Service interface {
}

// The verificationService struct implements the VerificationService interface
type service struct {
}

// NewVerificationService creates a new instance of the VerificationService
func NewService() Service {
	return &service{}
}
