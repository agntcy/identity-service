/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Form} from '@/components/ui/form';
import {RuleFormValues, RuleSchema} from '@/schemas/rule-schema';
import {Policy, Rule} from '@/types/api/policy';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button, Modal, ModalActions, ModalContent, ModalTitle, toast} from '@outshift/spark-design';
import {useCallback, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {RuleForm} from './forms/rule-form';
import {useCreateRule, useUpdateRule} from '@/mutations';
import {validateForm} from '@/lib/utils';
import z from 'zod';
import {useAnalytics} from '@/hooks';

interface AddEditRuleProps {
  open: boolean;
  policy?: Policy;
  rule?: Rule;
  mode?: 'add' | 'edit';
  onClose?: () => void;
}

export const AddEditRule = ({policy, open, rule, mode = 'add', onClose}: AddEditRuleProps) => {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(RuleSchema),
    mode: 'all',
    defaultValues: {
      name: undefined,
      description: undefined,
      needsApproval: false,
      tasks: []
    }
  });

  const {analyticsTrack} = useAnalytics();

  const createRule = useCreateRule({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Rule created successfully',
          description: 'The rule has been created.',
          type: 'success'
        });
        onClose?.();
      },
      onError: () => {
        toast({
          title: 'Error creating rule',
          description: 'There was an error creating the rule. Please try again.',
          type: 'error'
        });
        onClose?.();
      }
    }
  });

  const updateRule = useUpdateRule({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Rule updated successfully',
          description: 'The rule has been updated.',
          type: 'success'
        });
        onClose?.();
      },
      onError: () => {
        toast({
          title: 'Error updating rule',
          description: 'There was an error updating the rule. Please try again.',
          type: 'error'
        });
        onClose?.();
      }
    }
  });

  const onSubmit = useCallback(() => {
    const values = form.getValues();
    const validationResult = validateForm(RuleSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof RuleSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    if (mode === 'add') {
      analyticsTrack('CLICK_ADD_RULE_POLICY');
      createRule.mutate({
        id: policy?.id ?? '',
        data: {
          name: values.name,
          description: values.description,
          needsApproval: values.needsApproval,
          tasks: [...values.tasks],
          action: values.action
        }
      });
    } else if (mode === 'edit' && rule?.id && policy?.id) {
      analyticsTrack('CLICK_EDIT_RULE_POLICY');
      updateRule.mutate({
        policyId: policy?.id ?? '',
        ruleId: rule.id,
        data: {
          name: values.name,
          description: values.description,
          needsApproval: values.needsApproval,
          tasks: [...values.tasks],
          action: values.action
        }
      });
    }
  }, [analyticsTrack, createRule, form, mode, policy?.id, rule?.id, updateRule]);

  useEffect(() => {
    if (rule?.id && mode === 'edit') {
      form.reset({
        name: rule.name,
        description: rule.description,
        needsApproval: rule.needsApproval,
        tasks: rule.tasks?.map((task) => task.id) ?? [],
        action: rule.action
      });
    }
  }, [rule, mode, form]);

  return (
    <Modal open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <ModalTitle>{mode === 'add' ? 'Add Rule' : 'Edit Rule'}</ModalTitle>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <ModalContent>
            <RuleForm policy={policy} />
          </ModalContent>
          <ModalActions>
            <Button onClick={onClose} variant="tertariary" disabled={createRule.isPending} sx={{fontWeight: '600 !important'}}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRule.isPending || !form.formState.isValid}
              loading={createRule.isPending}
              loadingPosition="start"
              sx={{fontWeight: '600 !important'}}
            >
              Save
            </Button>
          </ModalActions>
        </form>
      </Form>
    </Modal>
  );
};
