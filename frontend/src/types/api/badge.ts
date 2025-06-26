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
  BadgeServiceIssueBadgeBody
} from '@/api/generated/identity/badge_service.swagger.api';

export type {
  V1Alpha1Badge as Badge,
  V1Alpha1BadgeClaims as BadgeClaims,
  V1Alpha1CredentialSchema as CredentialSchema,
  V1Alpha1IssueA2ABadgeRequest as IssueA2ABadgeRequest,
  V1Alpha1IssueMcpBadgeRequest as IssueMcpBadgeRequest,
  V1Alpha1Proof as Proof,
  V1Alpha1VerifiableCredential as VerifiableCredential,
  V1Alpha1VerifyBadgeRequest as VerifyBadgeRequest,
  BadgeServiceIssueBadgeBody as IssueBadgeBody
};
