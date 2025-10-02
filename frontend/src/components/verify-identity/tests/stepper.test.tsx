/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, expect, vi} from 'vitest';
import {
  StepperProvider,
  StepperControls,
  StepperNavigation,
  StepperStep,
  StepperTitle,
  StepperDescription,
  StepperPanel,
  useStepper
} from '../stepper';
import {defineStepper} from '@/components/ui/stepper';

// Mock the defineStepper utility
vi.mock('@/components/ui/stepper', () => ({
  defineStepper: vi.fn(() => ({
    StepperProvider: vi.fn(),
    StepperControls: vi.fn(),
    StepperNavigation: vi.fn(),
    StepperStep: vi.fn(),
    StepperTitle: vi.fn(),
    StepperDescription: vi.fn(),
    StepperPanel: vi.fn(),
    useStepper: vi.fn()
  }))
}));

describe('VerifyIdentity Stepper', () => {
  it('exports all required stepper components and hooks', () => {
    expect(StepperProvider).toBeDefined();
    expect(StepperControls).toBeDefined();
    expect(StepperNavigation).toBeDefined();
    expect(StepperStep).toBeDefined();
    expect(StepperTitle).toBeDefined();
    expect(StepperDescription).toBeDefined();
    expect(StepperPanel).toBeDefined();
    expect(useStepper).toBeDefined();
  });
  it('configures stepper with correct step definitions', () => {
    expect(defineStepper).toHaveBeenCalledWith(
      {
        id: 'verifyIdentityForm',
        title: 'Upload Badge',
        description: 'Upload your badge to verify the identity',
        schema: expect.any(Object) // VerifyIdentitySchema
      },
      {
        id: 'verficationResults',
        title: 'Verification Results',
        description: 'View the results of your badge verification',
        schema: expect.any(Object) // z.object({})
      }
    );
  });
});
