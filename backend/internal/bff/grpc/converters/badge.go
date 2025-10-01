// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	badgetypes "github.com/agntcy/identity-service/internal/core/badge/types"
	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
)

func FromBadge(src *badgetypes.Badge) *identity_service_sdk_go.Badge {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.Badge{
		VerifiableCredential: FromVerifiableCredential(&src.VerifiableCredential),
		AppId:                ptrutil.Ptr(src.AppID),
	}
}

func FromCredentialSchema(
	src *badgetypes.CredentialSchema,
) *identity_service_sdk_go.CredentialSchema {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.CredentialSchema{
		Type: ptrutil.Ptr(src.Type),
		Id:   ptrutil.Ptr(src.ID),
	}
}

func FromCredentialStatus(
	src *badgetypes.CredentialStatus,
) *identity_service_sdk_go.CredentialStatus {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.CredentialStatus{
		Id:        ptrutil.Ptr(src.ID),
		Type:      ptrutil.Ptr(src.Type),
		CreatedAt: newTimestamp(&src.CreatedAt),
		Purpose:   ptrutil.Ptr(identity_service_sdk_go.CredentialStatusPurpose(src.Purpose)),
	}
}

func FromProof(src *badgetypes.Proof) *identity_service_sdk_go.Proof {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.Proof{
		Type:         ptrutil.Ptr(src.Type),
		ProofPurpose: ptrutil.Ptr(src.ProofPurpose),
		ProofValue:   ptrutil.Ptr(src.ProofValue),
	}
}

func FromVerifiableCredential(
	src *badgetypes.VerifiableCredential,
) *identity_service_sdk_go.VerifiableCredential {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.VerifiableCredential{
		Context:           src.Context,
		Type:              src.Type,
		Issuer:            ptrutil.Ptr(src.Issuer),
		CredentialSubject: FromBadgeClaims(src.CredentialSubject),
		Id:                ptrutil.Ptr(src.ID),
		IssuanceDate:      ptrutil.Ptr(src.IssuanceDate),
		ExpirationDate:    ptrutil.Ptr(src.ExpirationDate),
		CredentialSchema: convertutil.ConvertSlice(
			src.CredentialSchema,
			FromCredentialSchema,
		),
		CredentialStatus: convertutil.ConvertSlice(
			src.Status,
			FromCredentialStatus,
		),
		Proof: FromProof(src.Proof),
	}
}

func FromBadgeClaims(src *badgetypes.BadgeClaims) *identity_service_sdk_go.BadgeClaims {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.BadgeClaims{
		Id:    ptrutil.Ptr(src.ID),
		Badge: ptrutil.Ptr(src.Badge),
	}
}

func FromVerificationResult(src *badgetypes.VerificationResult) *identity_service_sdk_go.VerificationResult {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.VerificationResult{
		Status:                       ptrutil.Ptr(src.Status),
		Document:                     FromVerifiableCredential(src.Document),
		MediaType:                    ptrutil.Ptr(src.MediaType),
		Controller:                   ptrutil.Ptr(src.Controller),
		ControlledIdentifierDocument: ptrutil.Ptr(src.ControlledIdentifierDocument),
		Warnings:                     convertutil.ConvertSlice(src.Warnings, FromErrorInfo),
		Errors:                       convertutil.ConvertSlice(src.Errors, FromErrorInfo),
	}
}

func FromErrorInfo(src *badgetypes.ErrorInfo) *identity_service_sdk_go.ErrorInfo {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.ErrorInfo{
		Reason:  ptrutil.Ptr(src.Reason),
		Message: ptrutil.Ptr(src.Message),
	}
}
