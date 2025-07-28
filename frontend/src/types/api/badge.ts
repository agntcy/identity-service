/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  V1Alpha1Badge,
  V1Alpha1BadgeClaims,
  V1Alpha1CredentialSchema,
  V1Alpha1IssueA2ABadgeRequest,
  V1Alpha1IssueMcpBadgeRequest,
  V1Alpha1Proof,
  V1Alpha1VerifiableCredential,
  V1Alpha1VerifyBadgeRequest,
  BadgeServiceIssueBadgeBody,
  V1Alpha1CredentialStatus,
  V1Alpha1VerificationResult
} from '@/api/generated/identity/badge_platform.swagger.api';

export type {
  V1Alpha1Badge as Badge,
  V1Alpha1BadgeClaims as BadgeClaims,
  V1Alpha1CredentialSchema as CredentialSchema,
  V1Alpha1IssueA2ABadgeRequest as IssueA2ABadgeRequest,
  V1Alpha1IssueMcpBadgeRequest as IssueMcpBadgeRequest,
  V1Alpha1Proof as Proof,
  V1Alpha1VerifiableCredential as VerifiableCredential,
  V1Alpha1VerifyBadgeRequest as VerifyBadgeRequest,
  BadgeServiceIssueBadgeBody as IssueBadgeBody,
  V1Alpha1CredentialStatus as CredentialStatus,
  V1Alpha1VerificationResult as VerificationResult
};

export enum ErrorReason {
  ERROR_REASON_UNSPECIFIED = 'ERROR_REASON_UNSPECIFIED',
  ERROR_REASON_INTERNAL = 'ERROR_REASON_INTERNAL',
  ERROR_REASON_INVALID_CREDENTIAL_ENVELOPE_TYPE = 'ERROR_REASON_INVALID_CREDENTIAL_ENVELOPE_TYPE',
  ERROR_REASON_INVALID_CREDENTIAL_ENVELOPE_VALUE_FORMAT = 'ERROR_REASON_INVALID_CREDENTIAL_ENVELOPE_VALUE_FORMAT',
  ERROR_REASON_INVALID_ISSUER = 'ERROR_REASON_INVALID_ISSUER',
  ERROR_REASON_ISSUER_NOT_REGISTERED = 'ERROR_REASON_ISSUER_NOT_REGISTERED',
  ERROR_REASON_INVALID_VERIFIABLE_CREDENTIAL = 'ERROR_REASON_INVALID_VERIFIABLE_CREDENTIAL',
  ERROR_REASON_IDP_REQUIRED = 'ERROR_REASON_IDP_REQUIRED',
  ERROR_REASON_INVALID_PROOF = 'ERROR_REASON_INVALID_PROOF',
  ERROR_REASON_UNSUPPORTED_PROOF = 'ERROR_REASON_UNSUPPORTED_PROOF',
  ERROR_REASON_RESOLVER_METADATA_NOT_FOUND = 'ERROR_REASON_RESOLVER_METADATA_NOT_FOUND',
  ERROR_REASON_UNKNOWN_IDP = 'ERROR_REASON_UNKNOWN_IDP',
  ERROR_REASON_ID_ALREADY_REGISTERED = 'ERROR_REASON_ID_ALREADY_REGISTERED',
  ERROR_REASON_VERIFIABLE_CREDENTIAL_REVOKED = 'ERROR_REASON_VERIFIABLE_CREDENTIAL_REVOKED'
}
