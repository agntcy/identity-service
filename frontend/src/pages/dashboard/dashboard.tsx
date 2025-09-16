/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {EmptyDashboard} from '@/components/dashboard/empty-dashboard';
import {StatsDashboard} from '@/components/dashboard/stats-dashboard';
import '@/styles/dashboard.css';

const Dashboard: React.FC = () => {
  const {isEmptyIdp} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp
    }))
  );
  if (isEmptyIdp) {
    return <EmptyDashboard />;
  }
  return <StatsDashboard />;
};

export default Dashboard;
