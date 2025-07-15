/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Policy, Rule} from '@/types/api/policy';
import {DeleteRule} from './delete-rule';
import {AddEditRule} from './add-edit-rule';
import {useGetRule} from '@/queries';
import {useCallback, useEffect, useState} from 'react';
import {Modal, toast} from '@outshift/spark-design';
import {LoaderRelative} from '@/components/ui/loading';

interface OpsRuleProps {
  policy?: Policy;
  rule?: Rule;
  isDelete?: boolean;
  isEdit?: boolean;
  isAdd?: boolean;
  onClose?: () => void;
}

export const OpsRule = ({policy, rule, isDelete, isEdit, isAdd, onClose}: OpsRuleProps) => {
  const [open, setOpen] = useState<boolean>(true);

  const {data, isLoading, isError} = useGetRule(policy?.id, rule?.id);

  useEffect(() => {
    if (isError) {
      toast({
        title: 'Error fetching rule',
        description: 'There was an error fetching the rule details. Please try again.',
        type: 'error'
      });
      onClose?.();
    }
  }, [isError, onClose]);

  const handleCloseModal = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  if (isError || !policy || !rule) {
    return;
  }

  if (isLoading) {
    return (
      <Modal open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <LoaderRelative />
      </Modal>
    );
  }

  if (isDelete) {
    return <DeleteRule policy={policy} rule={data} onClose={onClose} open={isDelete} />;
  }

  if (isEdit) {
    return <AddEditRule policy={policy} rule={data} mode="edit" onClose={onClose} open={isEdit} />;
  }

  if (isAdd) {
    return <AddEditRule policy={policy} mode="add" onClose={onClose} open={isAdd} />;
  }

  return null;
};
