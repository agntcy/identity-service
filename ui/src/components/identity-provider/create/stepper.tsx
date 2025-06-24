/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {defineStepper} from '@/components/ui/stepper';
import {IdentityProvidersSchema} from '@/schemas/identity-provider-schema';
import {z} from 'zod';

export const {StepperProvider, StepperControls, StepperNavigation, StepperStep, StepperTitle, StepperDescription, StepperPanel, useStepper} =
  defineStepper(
    {
      id: 'providerInfo',
      title: 'Provider Information',
      description: 'Select the identity provider you want to use and enter the provider information',
      schema: IdentityProvidersSchema
    },
    {
      id: 'registerProvider',
      title: 'Register Provider',
      description: 'Register the identity provider with the necessary details',
      schema: z.object({})
    }
  );
