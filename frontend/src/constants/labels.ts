/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AppType} from '@/types/api/app';
import {RuleAction} from '@/types/api/policy';
import {IdpType} from '@/types/api/settings';

export const labels = {
  appTypes: {
    [AppType.APP_TYPE_AGENT_OASF]: 'OASF',
    [AppType.APP_TYPE_AGENT_A2A]: 'A2A Agent',
    [AppType.APP_TYPE_MCP_SERVER]: 'MCP Server'
  },
  providerTypes: {
    [IdpType.IDP_TYPE_OKTA]: 'Okta',
    [IdpType.IDP_TYPE_DUO]: 'Duo',
    [IdpType.IDP_TYPE_SELF]: 'OASF (AGNTCY)',
    [IdpType.IDP_TYPE_ORY]: 'Ory',
    [IdpType.IDP_TYPE_KEYCLOAK]: 'Keycloak'
  },
  rulesActions: {
    [RuleAction.RULE_ACTION_UNSPECIFIED]: 'Unspecified',
    [RuleAction.RULE_ACTION_ALLOW]: 'Allow',
    [RuleAction.RULE_ACTION_DENY]: 'Deny'
  }
};
