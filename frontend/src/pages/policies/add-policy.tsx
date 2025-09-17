/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {AddEditPolicyStepper} from '@/components/policies/add-edit/add-edit-stepper';
import {PATHS} from '@/router/paths';
import {docs} from '@/utils/docs';
import {Link} from '@cisco-eti/spark-design';
import {ExternalLinkIcon} from 'lucide-react';

const AddPolicy: React.FC = () => {
  return (
    <BasePage
      title="Add Policy"
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
        <Link href={docs('policies')} openInNewTab>
          <div className="flex items-center gap-1">
            View Documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      }
    >
      <AddEditPolicyStepper mode="add" />
    </BasePage>
  );
};

export default AddPolicy;
