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
  onCancel,
  onBadgeCreated,
  ...props
}: BadgeModalFormProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<BadgeFormValues>({
    resolver: zodResolver(BadgeSchema),
    mode: 'all'
  });

  const navigate = useNavigate();

  const createBadge = useIssueBadge({
    callbacks: {
      onSuccess: (resp) => {
        setIsLoading(false);
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
        setIsLoading(false);
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
    setIsLoading(true);
    const data: IssueBadgeBody = {};
    if (app?.type === AppType.APP_TYPE_AGENT_OASF) {
      data.oasf = {
        schemaBase64: encodeBase64(values.oasfSpecsContent!) || ''
      };
    } else if (app?.type === AppType.APP_TYPE_MCP_SERVER) {
      data.mcp = {
        url: values.mcpServer || ''
      };
    } else if (app?.type === AppType.APP_TYPE_AGENT_A2A) {
      data.a2a = {
        wellKnownUrl: values.wellKnowServer || ''
      };
    }
    createBadge.mutate({
      id: app?.id || '',
      data: {...data}
    });
  }, [app?.id, app?.type, createBadge, form]);

  useEffect(() => {
    form.reset({
      type: app.type,
      oasfSpecs: undefined,
      mcpServer: undefined,
      wellKnowServer: undefined,
      oasfSpecsContent: undefined
    });
  }, [app.type, form]);

  return (
    <Modal maxWidth="lg" fullWidth {...props}>
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
                        disabled={isLoading}
                        defaultFile={field.value}
                        ref={field.ref}
                        name={field.name}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file ? file : undefined);
                        }}
                        onConvert={(content) => {
                          form.setValue('oasfSpecsContent', content ? new TextDecoder().decode(content) : undefined);
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
                      <Input placeholder="Type the URL of the mcp server..." {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            {app.type === AppType.APP_TYPE_AGENT_A2A && (
              <FormField
                control={form.control}
                name="wellKnowServer"
                render={({field}) => (
                  <FormItem>
                    <FormLabel className="form-label">Well Know Server</FormLabel>
                    <FormControl>
                      <Input placeholder="Type the URL of the well know server..." {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </ModalContent>
          <ModalActions>
            <Button onClick={onCancel} variant="tertariary" disabled={isLoading} sx={{fontWeight: '600 !important'}}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !form.formState.isValid} loading={isLoading} loadingPosition="start">
              {confirmButtonText || 'Continue'}
            </Button>
          </ModalActions>
        </form>
      </Form>
    </Modal>
  );
};
