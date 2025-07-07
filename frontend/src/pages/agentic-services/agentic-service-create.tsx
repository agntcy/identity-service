/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {CreateAgenticServiceStepper} from '@/components/agentic-services/create/create-agentic-service-stepper';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import {docs} from '@/utils/docs';
import {Link} from '@outshift/spark-design';
import {ExternalLinkIcon} from 'lucide-react';

const CreateAgenticService: React.FC = () => {
  return (
    <BasePage
      title="Create Agentic Service"
      useBorder
      breadcrumbs={[
        {
          text: 'Agentic Services',
          link: PATHS.agenticServices.base
        },
        {
          text: 'Create Agentic Service'
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
      <CreateAgenticServiceStepper />
    </BasePage>
  );
};

export default CreateAgenticService;
