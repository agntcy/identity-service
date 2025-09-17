/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Policy, Rule} from '@/types/api/policy';
import {DeleteRule} from './delete-rule';
import {AddEditRule} from './add-edit-rule';
import {useGetRule} from '@/queries';
import {useCallback, useState} from 'react';
import {EmptyState, Modal} from '@cisco-eti/spark-design';
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
  const enabled = isDelete || isEdit;
  const {data, isLoading, isError} = useGetRule(policy?.id, rule?.id, enabled);
  const [open, setOpen] = useState<boolean>(isLoading || (isError && !isAdd));

  const handleCloseModal = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  if (isLoading) {
    return (
      <Modal open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <LoaderRelative />
      </Modal>
    );
  }

  if (isError && !isAdd) {
    return (
      <Modal open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <EmptyState
          title="No Rule Found"
          description={
            isError ? 'There was an error fetching the rule details.' : 'Please select a rule to view its details.'
          }
          actionTitle="Close"
          actionCallback={handleCloseModal}
          containerProps={{paddingBottom: '32px'}}
          variant={isError ? 'negative' : 'info'}
        />
      </Modal>
    );
  }

  if (isDelete) {
    return <DeleteRule policy={policy} rule={data} onClose={handleCloseModal} open={isDelete} />;
  }

  if (isEdit) {
    return <AddEditRule policy={policy} rule={data} mode="edit" onClose={handleCloseModal} open={isEdit} />;
  }

  if (isAdd) {
    return <AddEditRule policy={policy} mode="add" onClose={handleCloseModal} open={isAdd} />;
  }

  return (
    <Modal open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
      <EmptyState
        title="No Rule Found"
        description="Please select a rule to view its details."
        actionTitle="Close"
        actionCallback={handleCloseModal}
        containerProps={{paddingBottom: '32px'}}
      />
    </Modal>
  );
};
