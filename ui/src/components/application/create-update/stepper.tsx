/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {defineStepper} from '@/components/ui/stepper';
import {ApplicationTypeSchema, SourceInformationSchema} from '@/schemas/application-schema';
import {z} from 'zod';

export const {StepperProvider, StepperControls, StepperNavigation, StepperStep, StepperTitle, StepperDescription, StepperPanel, useStepper} =
  defineStepper(
    {
      id: 'applicationType',
      title: 'Application Type',
      description: 'Select the type of application you want to create',
      schema: ApplicationTypeSchema
    },
    {
      id: 'sourceInfo',
      title: 'Source Information',
      description: 'Provide the source information for your application',
      schema: SourceInformationSchema
    },
    {
      id: 'saveApplication',
      title: 'Save Application',
      description: 'Save the application with the provided details',
      schema: z.object({})
    }
  );
