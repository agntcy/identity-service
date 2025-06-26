/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {CreateAgenticServiceStepper} from '@/components/agentic-services/create/create-agentic-service-stepper';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';

const CreateAgenticService: React.FC = () => {
  return (
    <BasePage
      title="Create Agentic Service"
      useBreadcrumbs={true}
      breadcrumbs={[
        {
          text: 'Agentic Services',
          link: PATHS.agenticServices.base
        },
        {
          text: 'Create Agentic Service'
        }
      ]}
    >
      <CreateAgenticServiceStepper />
    </BasePage>
  );
};

export default CreateAgenticService;
