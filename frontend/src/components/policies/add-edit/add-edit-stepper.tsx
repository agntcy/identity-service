/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Policy} from '@/types/api/policy';
import {StepperProvider} from './stepper';
import {AddPolicyForm} from './add-policy-form';
import {EditPolicyForm} from './edit-policy-form';

export const AddEditPolicyStepper = ({mode = 'add', policy}: {mode: 'add' | 'edit'; policy?: Policy}) => {
  return <StepperProvider variant="vertical">{mode === 'add' ? <AddPolicyForm /> : <EditPolicyForm policy={policy} />}</StepperProvider>;
};
