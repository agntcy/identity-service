/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {defineStepper} from '@/components/ui/stepper';
import {AgenticServiceSchema} from '@/schemas/agentic-service-schema';
import {z} from 'zod';

export const {
  StepperProvider,
  StepperControls,
  StepperNavigation,
  StepperStep,
  StepperTitle,
  StepperDescription,
  StepperPanel,
  useStepper
} = defineStepper(
  {
    id: 'agenticServiceForm',
    title: 'Agentic Service Type & Details',
    description: 'Select the agentic service type you want to use and enter the service information',
    schema: AgenticServiceSchema
  },
  {
    id: 'confirmAgenticService',
    title: 'Register Agentic Service',
    description: 'Confirm the registration of the agentic service',
    schema: z.object({})
  }
);
