/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ViewSwitcher} from '@outshift/spark-design';
import {useState} from 'react';
import {App} from '@/types/api/app';
import {AboutAgenticService} from './about-agentic-service';
import {ListPoliciesByAgenticService} from './list-policies-by-agentic-service';
import {useSearchParams} from 'react-router-dom';
import {useFeatureFlagsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';

export const InfoAgenticService = ({app, onChangeReissueBadge}: {app?: App; onChangeReissueBadge?: (value: boolean) => void}) => {
  const [searchParams] = useSearchParams();
  const viewHelper = searchParams.get('view');

  const [view, setView] = useState(viewHelper === 'policies-assigned' ? 'policies-assigned' : 'about');
  const options = [
    {
      value: 'about',
      label: 'About'
    },
    {
      value: 'policies-assigned',
      label: 'Policies Assigned'
    },
    {
      value: 'policies-used-by',
      label: 'Policies Used By',
      disabled: true
    }
  ];

  const {isTbacEnable} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnable: state.featureFlags.isTbacEnable
    }))
  );

  if (!isTbacEnable) {
    return <AboutAgenticService app={app} onChangeReissueBadge={onChangeReissueBadge} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ViewSwitcher
          options={options}
          value={view}
          onChange={(newView) => {
            setView(newView);
          }}
          size="sm"
        />
      </div>
      {view === 'about' && <AboutAgenticService app={app} onChangeReissueBadge={onChangeReissueBadge} />}
      {view === 'policies-assigned' && <ListPoliciesByAgenticService appId={app?.id} />}
    </div>
  );
};
