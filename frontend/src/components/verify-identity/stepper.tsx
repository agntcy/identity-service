/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {defineStepper} from '@/components/ui/stepper';
import {VerifyIdentitySchema} from '@/schemas/verify-identity-schema';
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
    id: 'verifyIdentityForm',
    title: 'Upload Badge',
    description: 'Upload your badge to verify the identity',
    schema: VerifyIdentitySchema
  },
  {
    id: 'verficationResults',
    title: 'Verification Results',
    description: 'View the results of your badge verification',
    schema: z.object({})
  }
);
