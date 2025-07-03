/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {CreatePolicyStepper} from '@/components/policies/create/create-policy-stepper';
import {PATHS} from '@/router/paths';
import {Link} from '@outshift/spark-design';
import {ExternalLinkIcon} from 'lucide-react';

const CreatePolicies: React.FC = () => {
  return (
    <BasePage
      title="Add Policy"
      useBorder
      breadcrumbs={[
        {
          text: 'Policies',
          link: PATHS.policies.base
        },
        {
          text: 'Add Policy'
        }
      ]}
      rightSideItems={
        <Link href="" openInNewTab>
          <div className="flex items-center gap-1">
            View Documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      }
    >
      <CreatePolicyStepper />
    </BasePage>
  );
};

export default CreatePolicies;
