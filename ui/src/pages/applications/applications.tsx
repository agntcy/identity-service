/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import {Button} from '@outshift/spark-design';
import {PlusIcon} from 'lucide-react';
import {Link} from 'react-router-dom';

const Applications: React.FC = () => {
  return (
    <BasePage
      title="Applications"
      useBreadcrumbs={false}
      rightSideItems={
        <Link to={PATHS.applicationsCreate}>
          <Button startIcon={<PlusIcon className="w-4 h-4" />} variant="primary">
            Create Application
          </Button>
        </Link>
      }
    >
      <div></div>
      {/* <EmptyProvider /> */}
      {/* <div className="space-y-4 w-full">
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
      </div> */}

      {/* {identityProvider && passwordManagementProvider ? <PlaceholderPageContent /> : <EmptyProvider />} */}
    </BasePage>
  );
};

export default Applications;
