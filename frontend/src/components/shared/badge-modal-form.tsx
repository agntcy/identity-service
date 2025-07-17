/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {App, AppType} from '@/types/api/app';
import {validateForm} from '@/lib/utils';
import {Button} from '@mui/material';
import {Modal, ModalActions, ModalContent, ModalProps, ModalTitle, toast} from '@outshift/spark-design';
import {BadgeFormValues, BadgeSchema} from '@/schemas/badge-schema';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Form, FormControl, FormField, FormItem, FormLabel} from '../ui/form';
import {useCallback, useEffect, useState} from 'react';
import {FileUpload} from '../ui/file-upload';
import {Input} from '../ui/input';
import {useIssueBadge} from '@/mutations';
import z from 'zod';
import {Badge, IssueBadgeBody} from '@/types/api/badge';
import {encodeBase64} from '@/utils/utils';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {useAnalytics} from '@/hooks';

interface BadgeModalFormProps extends ModalProps {
  title?: string;
  app: App;
  confirmButtonText?: string;
  navigateTo?: boolean;
  onCancel: () => void;
  onBadgeCreated?: (badge: Badge) => void;
}

export const BadgeModalForm = ({
  title = 'Create Badge',
  app,
  confirmButtonText = 'Create',
  navigateTo = true,
  open,
  onCancel,
  onBadgeCreated,
  ...props
}: BadgeModalFormProps) => {
  const form = useForm<BadgeFormValues>({
    resolver: zodResolver(BadgeSchema),
    mode: 'all',
    defaultValues: {
      type: app.type,
      oasfSpecs: undefined,
      mcpServer: undefined,
      wellKnownServer: undefined,
      oasfSpecsContent: undefined
    }
  });

  const navigate = useNavigate();

  const {analyticsTrack} = useAnalytics();

  const createBadge = useIssueBadge({
    callbacks: {
      onSuccess: (resp) => {
        toast({
          title: 'Badge created successfully',
          description: 'You can now use this badge in your applications.',
          type: 'success'
        });
        onBadgeCreated?.(resp.data);
        if (navigateTo) {
          const path = generatePath(PATHS.agenticServices.info, {id: app.id});
          void navigate(path, {replace: true});
        }
      },
      onError: () => {
        toast({
          title: 'Error creating badge',
          description: 'There was an error while trying to create the badge. Please try again later.',
          type: 'error'
        });
      }
    }
  });

  const onSubmit = useCallback(() => {
    const values = form.getValues();
    const validationResult = validateForm(BadgeSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof BadgeSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    const data: IssueBadgeBody = {};
    if (app?.type === AppType.APP_TYPE_AGENT_OASF) {
      data.oasf = {
        schemaBase64: encodeBase64(values.oasfSpecsContent!) || ''
      };
    } else if (app?.type === AppType.APP_TYPE_MCP_SERVER) {
      data.mcp = {
        name: app.name,
        url: values.mcpServer || ''
      };
    } else if (app?.type === AppType.APP_TYPE_AGENT_A2A) {
      data.a2a = {
        wellKnownUrl: values.wellKnownServer || ''
      };
    }
    analyticsTrack('CLICK_CREATE_BADGE_AGENTIC_SERVICE', {
      type: app.type
    });
    createBadge.mutate({
      id: app?.id || '',
      data: {...data}
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.id, app?.type, createBadge]);

  useEffect(() => {
    form.reset({
      type: app.type,
      oasfSpecs: undefined,
      mcpServer: undefined,
      wellKnownServer: undefined,
      oasfSpecsContent: undefined
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.type, open]);

  return (
    <Modal open={open} maxWidth="lg" fullWidth {...props}>
      <ModalTitle>{title}</ModalTitle>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <ModalContent>
            {app.type === AppType.APP_TYPE_AGENT_OASF && (
              <FormField
                control={form.control}
                name="oasfSpecs"
                render={({field}) => (
                  <FormItem>
                    <FormLabel className="form-label">OASF specs</FormLabel>
                    <FormControl>
                      <FileUpload
                        disabled={createBadge.isPending}
                        ref={field.ref}
                        name={field.name}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file);
                        }}
                        onConvert={(content) => {
                          try {
                            const decodedContent = content ? new TextDecoder().decode(content) : undefined;
                            form.setValue('oasfSpecsContent', decodedContent);
                          } catch (error) {
                            toast({
                              title: 'Invalid OASF specs',
                              description: 'The uploaded file does not contain valid OASF specs.',
                              type: 'error'
                            });
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            {app.type === AppType.APP_TYPE_MCP_SERVER && (
              <FormField
                control={form.control}
                name="mcpServer"
                render={({field}) => (
                  <FormItem>
                    <FormLabel className="form-label">URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Type the URL of the mcp server..." {...field} disabled={createBadge.isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            {app.type === AppType.APP_TYPE_AGENT_A2A && (
              <FormField
                control={form.control}
                name="wellKnownServer"
                render={({field}) => (
                  <FormItem>
                    <FormLabel className="form-label">Well Known Server</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Type the URL of the well known server..."
                        {...field}
                        disabled={createBadge.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </ModalContent>
          <ModalActions>
            <Button
              onClick={onCancel}
              variant="tertariary"
              disabled={createBadge.isPending}
              sx={{fontWeight: '600 !important'}}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBadge.isPending || !form.formState.isValid}
              loading={createBadge.isPending}
              loadingPosition="start"
              sx={{fontWeight: '600 !important'}}
            >
              {confirmButtonText ?? 'Continue'}
            </Button>
          </ModalActions>
        </form>
      </Form>
    </Modal>
  );
};
