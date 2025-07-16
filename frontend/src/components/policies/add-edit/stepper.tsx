/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {defineStepper} from '@/components/ui/stepper';
import {PolicySchema} from '@/schemas/policy-schema';
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
    id: 'policyForm',
    title: 'Policy Details',
    description: 'Provide the details for the policy you want to create',
    schema: PolicySchema
  },
  {
    id: 'policyLogic',
    title: 'Policy Rules',
    description: 'Define the logic for the policy',
    schema: z.object({})
  },
  {
    id: 'policyReview',
    title: 'Review Policy',
    description: 'Review the policy details before submission',
    schema: z.object({})
  }
);
