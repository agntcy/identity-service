/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Form, FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {useAnalytics} from '@/hooks';
import {validateForm} from '@/lib/utils';
import {useUpdateTenant} from '@/mutations';
import {PATHS} from '@/router/paths';
import {OrganizationFormValues, OrganizationSchema} from '@/schemas/organization-schema';
import {TenantReponse} from '@/types/api/iam';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button, toast, Typography} from '@open-ui-kit/core';
import {useCallback, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {Link, useNavigate} from 'react-router-dom';
import z from 'zod';

export const EditOrganizationForm = ({tenant}: {tenant?: TenantReponse}) => {
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(OrganizationSchema),
    mode: 'all',
    defaultValues: {
      name: tenant?.name || ''
    }
  });

  const {analyticsTrack} = useAnalytics();

  const navigate = useNavigate();

  const updateOrganizationMutation = useUpdateTenant({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Organization edited successfully.',
          type: 'success'
        });
        void navigate(PATHS.settings.organizationsAndUsers.base, {replace: true});
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'An error occurred while editing the organization. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const onSubmit = useCallback(() => {
    const values = form.getValues();
    const validationResult = validateForm(OrganizationSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof OrganizationSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    analyticsTrack('CLICK_SAVE_EDIT_ORGANIZATION');
    updateOrganizationMutation.mutate({
      id: tenant?.id || '',
      name: values.name
    });
  }, [analyticsTrack, form, tenant?.id, updateOrganizationMutation]);

  useEffect(() => {
    form.reset({
      name: tenant?.name || ''
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card className="text-start" variant="secondary">
            <CardContent className="space-y-6 p-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Details
                  </Typography>
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({field}) => (
                    <FormItem className="w-[50%]">
                      <FormLabel className="form-label">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Type the name of your organization..."
                          {...field}
                          disabled={updateOrganizationMutation.isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-4">
            <Link to={PATHS.settings.organizationsAndUsers.base}>
              <Button
                variant="tertariary"
                disabled={updateOrganizationMutation.isPending}
                sx={{
                  fontWeight: '600 !important'
                }}
              >
                Cancel
              </Button>
            </Link>
            <Button
              sx={{
                fontWeight: '600 !important'
              }}
              type="submit"
              disabled={updateOrganizationMutation.isPending || !form.formState.isValid}
              loading={updateOrganizationMutation.isPending}
              loadingPosition="start"
            >
              Save
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
