/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button} from '@mui/material';
import {Modal, ModalActions, ModalContent, ModalProps, ModalTitle, toast} from '@outshift/spark-design';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Form, FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {useCallback, useEffect} from 'react';
import {Input} from '@/components/ui/input';
import {useInviteUser} from '@/mutations';
import {InviteUserFormValues, InviteUserSchema} from '@/schemas/invite-user-schema';
import {validateForm} from '@/lib/utils';
import z from 'zod';
import {useGetGroupsTenant} from '@/queries';
import {useAnalytics} from '@/hooks';

interface InviteUserModalProps extends ModalProps {
  title?: string;
  tenantId?: string;
  confirmButtonText?: string;
  onCancel: () => void;
  onUserInvited?: () => void;
  onGroupIdChange?: (groupId: string, isLoadingGroups: boolean, errorGroups: Error | null) => void;
}

export const InviteUserModal = ({
  title = 'Invite User',
  tenantId,
  confirmButtonText = 'Invite',
  onCancel,
  onUserInvited,
  onGroupIdChange,
  ...props
}: InviteUserModalProps) => {
  const {data: dataGroups, isLoading: isLoadingGroups, error: errorGroups} = useGetGroupsTenant(tenantId || '');
  const groupId = dataGroups?.groups?.[0]?.id || '';

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(InviteUserSchema),
    mode: 'all'
  });

  const {analyticsTrack} = useAnalytics();

  const inviteUser = useInviteUser({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'User invited successfully',
          description: 'The user has been invited to the group.',
          type: 'success'
        });
        onUserInvited?.();
      },
      onError: () => {
        toast({
          title: 'Error inviting user',
          description: 'An error occurred while inviting the user. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const onSubmit = useCallback(() => {
    const values = form.getValues();
    const validationResult = validateForm(InviteUserSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof InviteUserSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    analyticsTrack('CLICK_INVITE_USER_CONFIRM');
    inviteUser.mutate({
      groupId: groupId,
      data: {
        username: values.email
      }
    });
  }, [analyticsTrack, form, groupId, inviteUser]);

  useEffect(() => {
    onGroupIdChange?.(groupId, isLoadingGroups, errorGroups);
  }, [errorGroups, groupId, isLoadingGroups, onGroupIdChange]);

  useEffect(() => {
    form.reset({
      email: ''
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal maxWidth="md" fullWidth {...props}>
      <ModalTitle>{title}</ModalTitle>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <ModalContent>
            <FormField
              control={form.control}
              name="email"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="form-label">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Type the email of the user..." {...field} disabled={inviteUser.isPending} />
                  </FormControl>
                </FormItem>
              )}
            />
          </ModalContent>
          <ModalActions>
            <Button
              onClick={onCancel}
              variant="tertariary"
              disabled={inviteUser.isPending}
              sx={{fontWeight: '600 !important'}}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteUser.isPending || !form.formState.isValid}
              loading={inviteUser.isPending}
              loadingPosition="start"
              sx={{fontWeight: '600 !important'}}
            >
              {confirmButtonText || 'Continue'}
            </Button>
          </ModalActions>
        </form>
      </Form>
    </Modal>
  );
};
