/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ContentDashboard} from '@/components/dashboard/content-dashboard';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import ScrollShadowWrapper from '@/components/ui/scroll-shadow-wrapper';
import {StatsDashboard} from '@/components/dashboard/stats-dashboard';
import '@/styles/dashboard.css';

const Dashboard: React.FC = () => {
  const {isEmptyIdp} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp
    }))
  );

  const showStatsDashboard = !isEmptyIdp;

  return (
    <ScrollShadowWrapper>
      <div>
        <ContentDashboard />
      </div>
      {showStatsDashboard && (
        <div>
          <StatsDashboard />
        </div>
      )}
    </ScrollShadowWrapper>
  );
};

export default Dashboard;
