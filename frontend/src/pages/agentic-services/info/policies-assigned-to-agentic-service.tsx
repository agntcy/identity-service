/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {ListPoliciesAgenticService} from '@/components/agentic-services/info/list-policies-agentic-service';
import {App} from '@/types/api/app';
import {useOutletContext} from 'react-router-dom';

const PoliciesAssignedToAgenticService: React.FC = () => {
  const context = useOutletContext<{app?: App}>();

  if (!context) {
    return null;
  }

  const {app} = context;

  if (!app) {
    return null;
  }

  return <ListPoliciesAgenticService appId={app?.id} mode="assigned" />;
};

export default PoliciesAssignedToAgenticService;
