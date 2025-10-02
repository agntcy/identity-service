/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
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
