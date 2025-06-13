/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApplicationTypes, SourceTypes} from '@/types/applications';
import {IdentityProviders} from '@/types/providers';

export const labels = {
  appTypes: {
    [ApplicationTypes.OASF]: 'Open Agentic Schema Framework (OASF)',
    [ApplicationTypes.A2A]: 'Application to Application (A2A)',
    [ApplicationTypes.MCP]: 'Model Context Protocol (MCP)'
  },
  sourceAppTypes: {
    [SourceTypes.URL]: 'URL',
    [SourceTypes.DOCKER]: 'Docker',
    [SourceTypes.GIT]: 'Git',
    [SourceTypes.OASF_SPECS]: 'Open Agentic Schema Framework (OASF)'
  },
  providerTypes: {
    [IdentityProviders.OKTA]: 'Okta',
    [IdentityProviders.DUO]: 'Duo'
  }
};
