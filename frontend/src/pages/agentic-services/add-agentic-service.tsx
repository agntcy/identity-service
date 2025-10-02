/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AddAgenticServiceStepper} from '@/components/agentic-services/add/add-agentic-service-stepper';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import {docs} from '@/utils/docs';
import {Link} from '@open-ui-kit/core';
import {ExternalLinkIcon} from 'lucide-react';

const AddAgenticService: React.FC = () => {
  return (
    <BasePage
      title="Add Agentic Service"
      breadcrumbs={[
        {
          text: 'Agentic Services',
          link: PATHS.agenticServices.base
        },
        {
          text: 'Add Agentic Service'
        }
      ]}
      rightSideItems={
        <Link href={docs('agentic-service')} openInNewTab>
          <div className="flex items-center gap-1">
            View Documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      }
    >
      <AddAgenticServiceStepper />
    </BasePage>
  );
};

export default AddAgenticService;
