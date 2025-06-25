/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {defineStepper} from '@/components/ui/stepper';
import {AgenticServiceSchema} from '@/schemas/agentic-service-schema';
import {z} from 'zod';

export const {StepperProvider, StepperControls, StepperNavigation, StepperStep, StepperTitle, StepperDescription, StepperPanel, useStepper} =
  defineStepper(
    {
      id: 'agenticServiceInfo',
      title: 'Agentic service type & source',
      description: 'Select the agentic service type you want to use and enter the service information',
      schema: AgenticServiceSchema
    }
    // {
    //   id: 'registerProvider',
    //   title: 'Register Provider',
    //   description: 'Register the identity provider with the necessary details',
    //   schema: z.object({})
    // }
  );
