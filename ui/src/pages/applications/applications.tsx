/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {EmptyProvider} from '@/components/shared/empty-provider';
import {Button} from '@/components/ui/button';
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Loading} from '@/components/ui/loading';
import PlaceholderPageContent from '@/components/ui/placeholder-page-content';
import ViewSwitch from '@/components/ui/view-switch';
import {PATHS} from '@/router/paths';
import {useStore} from '@/store';
import {PlusIcon} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {useShallow} from 'zustand/react/shallow';

// Utility function to calculate activeIdx based on viewSwitch value

const Applications: React.FC = () => {
  const [viewSwitch, setValueSwitch] = useState<'grid' | 'table'>('grid');

  const {identityProvider, passwordManagementProvider} = useStore(
    useShallow((store) => ({
      identityProvider: store.identityProvider,
      passwordManagementProvider: store.passwordManagementProvider
    }))
  );

  const calculateActiveIdx = useMemo(() => {
    if (viewSwitch === 'grid') {
      return 0;
    } else if (viewSwitch === 'table') {
      return 1;
    } else {
      return 0;
    }
  }, [viewSwitch]);

  return (
    <BasePage
      title="Applications"
      useBreadcrumbs={false}
      rightSideItems={
        <Link to={PATHS.applicationsCreate}>
          <Button>
            Create Application
            <PlusIcon />
          </Button>
        </Link>
      }
    >
      {/* <EmptyProvider /> */}
      <div className="space-y-4 w-full">
        <div className="flex justify-end">
          <ViewSwitch
            views={[
              {
                children: <p>Grid</p>,
                onClick: () => setValueSwitch('grid')
              },
              {
                children: <p>Table</p>,
                onClick: () => setValueSwitch('table')
              }
            ]}
            activeIdx={calculateActiveIdx}
          />
        </div>
      </div>

      {/* {identityProvider && passwordManagementProvider ? <PlaceholderPageContent /> : <EmptyProvider />} */}
    </BasePage>
  );
};

export default Applications;
