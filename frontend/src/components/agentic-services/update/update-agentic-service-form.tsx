/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {SharedProvider, SharedProviderProps} from '@/components/shared/shared-provider';
import {Card, CardContent} from '@/components/ui/card';
import {Form, FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {validateForm} from '@/lib/utils';
import {useUpdateAgenticService} from '@/mutations';
import {PATHS} from '@/router/paths';
import {AgenticServiceFormValues, AgenticServiceSchema} from '@/schemas/agentic-service-schema';
import {App, AppType} from '@/types/api/app';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button, toast, Typography} from '@outshift/spark-design';
import {useCallback, useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {generatePath, Link, useNavigate} from 'react-router-dom';
import z from 'zod';
import OasfLogo from '@/assets/oasf.svg?react';
import McpLogo from '@/assets/mcp.svg?react';
import A2ALogo from '@/assets/a2a.png';

export const UpdateAgenticServiceForm = ({app}: {app?: App}) => {
  const [isLoading, setIsLoading] = useState(false);

  const appTypes: SharedProviderProps<AppType>[] = [
    {
      type: AppType.APP_TYPE_AGENT_OASF,
      title: 'OASF',
      imgURI: <OasfLogo />,
      isDisabled: true,
      useTooltip: false
    },
    {
      type: AppType.APP_TYPE_MCP_SERVER,
      title: 'MCP Server',
      imgURI: <McpLogo className="w-5 h-5" />,
      isDisabled: true,
      useTooltip: false
    },
    {
      type: AppType.APP_TYPE_AGENT_A2A,
      title: 'A2A Agent',
      imgURI: <img src={A2ALogo} className="w-7 h-7" />,
      isDisabled: true,
      useTooltip: false
    }
  ];

  const form = useForm<AgenticServiceFormValues>({
    resolver: zodResolver(AgenticServiceSchema),
    mode: 'all',
    defaultValues: {
      name: app?.name ?? '',
      type: app?.type ?? undefined,
      description: app?.description ?? ''
    }
  });

  const navigate = useNavigate();

  const updateMutation = useUpdateAgenticService({
    callbacks: {
      onSuccess: () => {
        setIsLoading(false);
        toast({
          title: 'Success',
          description: 'Agentic service updated successfully.',
          type: 'success'
        });
        const path = generatePath(PATHS.agenticServices.info, {id: app?.id ?? ''});
        void navigate(path, {replace: true});
      },
      onError: () => {
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'An error occurred while updating the agentic service. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const onSubmit = useCallback(() => {
    const values = form.getValues();
    const validationResult = validateForm(AgenticServiceSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof AgenticServiceSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    setIsLoading(true);
    updateMutation.mutate({
      id: app?.id ?? '',
      data: {
        name: values.name,
        description: values.description
      }
    });
  }, [app?.id, form, updateMutation]);

  useEffect(() => {
    form.reset({
      type: app?.type ?? undefined,
      name: app?.name ?? undefined,
      description: app?.description ?? undefined
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card className="text-start py-4 rounded-[8px] p-[24px]" variant="secondary">
            <CardContent className="space-y-6 p-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Type
                  </Typography>
                </div>
                <FormField
                  control={form.control}
                  name="type"
                  render={({field}) => (
                    <FormItem>
                      <FormControl>
                        <div className="card-group">
                          {appTypes.map((appType, index) => (
                            <SharedProvider key={index} {...appType} isSelected={field.value === appType.type} onSelect={field.onChange} />
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Details
                  </Typography>
                </div>
                <div className="flex gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({field}) => (
                      <FormItem className="w-[50%]">
                        <FormLabel className="form-label">Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Type the name..." {...field} disabled={isLoading} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({field}) => (
                      <FormItem className="w-[50%]">
                        <FormLabel className="form-label">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Type the description..." {...field} disabled={isLoading} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-4">
            <Link to={PATHS.agenticServices.base}>
              <Button variant="tertariary" disabled={isLoading} sx={{fontWeight: '600 !important'}}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading || !form.formState.isValid}
              loading={isLoading}
              loadingPosition="start"
              sx={{fontWeight: '600 !important'}}
            >
              Update Agentic Service
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
