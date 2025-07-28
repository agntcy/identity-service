/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ListPoliciesAgenticService} from '@/components/agentic-platforms/info/list-policies-agentic-platform';
import {App} from '@/types/api/app';
import {useOutletContext} from 'react-router-dom';

const PoliciesAssignedToAgenticService: React.FC = () => {
  const {app} = useOutletContext<{app?: App}>();

  if (!app) {
    return null;
  }

  return <ListPoliciesAgenticService appId={app?.id} mode="assigned" />;
};

export default PoliciesAssignedToAgenticService;
