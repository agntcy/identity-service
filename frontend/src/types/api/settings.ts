/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  V1Alpha1ApiKey,
  V1Alpha1DuoIdpSettings,
  V1Alpha1IdpType,
  V1Alpha1IssuerSettings,
  V1Alpha1OktaIdpSettings,
  V1Alpha1KeycloakIdpSettings,
  V1Alpha1OryIdpSettings,
  V1Alpha1PingIdpSettings,
  V1Alpha1SetIssuerRequest,
  V1Alpha1Settings
} from '@/api/generated/identity/settings_service.swagger.api';

export type {
  V1Alpha1ApiKey as ApiKey,
  V1Alpha1DuoIdpSettings as DuoIdpSettings,
  V1Alpha1IssuerSettings as IssuerSettings,
  V1Alpha1OktaIdpSettings as OktaIdpSettings,
  V1Alpha1SetIssuerRequest as SetIssuerRequest,
  V1Alpha1Settings as Settings,
  V1Alpha1KeycloakIdpSettings as KeycloakIdpSettings,
  V1Alpha1OryIdpSettings as OryIdpSettings,
  V1Alpha1PingIdpSettings as PingIdpSettings
};

export {V1Alpha1IdpType as IdpType};
