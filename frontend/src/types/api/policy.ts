/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  V1Alpha1ListPoliciesResponse,
  V1Alpha1ListRulesResponse,
  V1Alpha1PagedResponse,
  V1Alpha1Policy,
  V1Alpha1Rule,
  V1Alpha1Task,
  V1Alpha1CreatePolicyRequest,
  PolicyServiceCreateRuleBody,
  V1Alpha1RuleAction
} from '@/api/generated/identity/policy_service.swagger.api';

export type {
  V1Alpha1ListPoliciesResponse as ListPoliciesResponse,
  V1Alpha1ListRulesResponse as ListRulesResponse,
  V1Alpha1PagedResponse as PagedResponse,
  V1Alpha1Policy as Policy,
  V1Alpha1Rule as Rule,
  V1Alpha1Task as Task,
  V1Alpha1CreatePolicyRequest as CreatePolicyRequest,
  PolicyServiceCreateRuleBody as CreateRuleBody
};

export {V1Alpha1RuleAction as RuleAction};
