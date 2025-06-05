/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {defineStepper} from '@/components/ui/stepper';
import {IdentityProvidersSchema, PasswordManagmentProviderSchema} from '@/schemas/identity-provider-schema';
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
      id: 'passwordManagement',
      title: 'Password Management',
      description: 'Select the password management provider you want to use',
      schema: PasswordManagmentProviderSchema
    },
    {
      id: 'last',
      title: '',
      description: '',
      schema: z.object({})
    }
  );
