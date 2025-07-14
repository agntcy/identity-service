/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Policy, Rule} from '@/types/api/policy';
import {DeleteRule} from './delete-rule';
import {AddEditRule} from './add-edit-rule';

interface OpsRuleProps {
  policy?: Policy;
  rule?: Rule;
  isDelete?: boolean;
  isEdit?: boolean;
  isAdd?: boolean;
  onClose?: () => void;
}

export const OpsRule = ({policy, rule, isDelete, isEdit, isAdd, onClose}: OpsRuleProps) => {
  if (isDelete) {
    return <DeleteRule policy={policy} rule={rule} onClose={onClose} open={isDelete} />;
  }

  if (isEdit) {
    return <AddEditRule policy={policy} rule={rule} mode="edit" onClose={onClose} open={isEdit} />;
  }

  if (isAdd) {
    return <AddEditRule policy={policy} mode="add" onClose={onClose} open={isAdd} />;
  }

  return null;
};
