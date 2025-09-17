/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useAnalytics} from '@/hooks';
import {useDeleteRule} from '@/mutations';
import {Policy, Rule} from '@/types/api/policy';
import {toast} from '@cisco-eti/spark-design';
import {useCallback} from 'react';

interface DeleteRuleProps {
  open: boolean;
  policy?: Policy;
  rule?: Rule;
  onClose?: () => void;
}

export const DeleteRule = ({policy, rule, open, onClose}: DeleteRuleProps) => {
  const mutationDeleteRule = useDeleteRule({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Rule deleted successfully',
          description: 'The rule has been deleted.',
          type: 'success'
        });
        onClose?.();
      },
      onError: () => {
        toast({
          title: 'Error deleting rule',
          description: 'There was an error deleting the rule. Please try again.',
          type: 'error'
        });
        onClose?.();
      }
    }
  });

  const {analyticsTrack} = useAnalytics();

  const handleConfirm = useCallback(() => {
    if (rule?.id && policy?.id) {
      analyticsTrack('CLICK_CONFIRM_DELETE_RULE_POLICY');
      mutationDeleteRule.mutate({
        policyId: policy.id,
        ruleId: rule.id
      });
    }
  }, [rule?.id, policy?.id, analyticsTrack, mutationDeleteRule]);

  return (
    <ConfirmModal
      open={open}
      title="Delete Rule"
      description="Are you sure you want to delete this rule? This action cannot be undone."
      confirmButtonText="Delete"
      onCancel={() => {
        onClose?.();
      }}
      onConfirm={handleConfirm}
      buttonConfirmProps={{
        loading: mutationDeleteRule.isPending,
        loadingPosition: 'start',
        color: 'negative'
      }}
    />
  );
};
