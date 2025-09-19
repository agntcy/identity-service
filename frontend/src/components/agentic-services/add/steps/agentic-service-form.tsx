/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useStepper} from '../stepper';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {useEffect} from 'react';
import {SharedProvider, SharedProviderProps} from '@/components/ui/shared-provider';
import {Input} from '@/components/ui/input';
import {Typography} from '@open-ui-kit/core';
import {AgenticServiceFormValues} from '@/schemas/agentic-service-schema';
import {AppType} from '@/types/api/app';
import OasfLogo from '@/assets/oasf.svg?react';
import McpLogo from '@/assets/mcp.svg?react';
import A2ALogo from '@/assets/a2a-logo.svg?react';
import {useAnalytics} from '@/hooks';

export const AgenticServicForm = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, reset} = useFormContext<AgenticServiceFormValues>();
  const methods = useStepper();

  const {analyticsTrack} = useAnalytics();

  const metaData = methods.getMetadata('agenticServiceForm') as AgenticServiceFormValues | undefined;

  const appTypes: SharedProviderProps<AppType>[] = [
    {
      type: AppType.APP_TYPE_AGENT_OASF,
      title: 'OASF',
      imgURI: <OasfLogo />,
      isDisabled: isLoading
    },
    {
      type: AppType.APP_TYPE_MCP_SERVER,
      title: 'MCP Server',
      imgURI: <McpLogo className="w-5 h-5" />,
      isDisabled: isLoading
    },
    {
      type: AppType.APP_TYPE_AGENT_A2A,
      title: 'A2A Agent',
      imgURI: <A2ALogo className="w-7 h-7" />,
      isDisabled: isLoading
    }
  ];

  useEffect(() => {
    if (metaData) {
      reset({
        type: metaData.type ?? undefined,
        name: metaData.name ?? undefined,
        description: metaData.description ?? undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaData]);

  return (
    <Card className="text-start py-4 rounded-[8px] p-[24px]" variant="secondary">
      <CardContent className="space-y-6 p-0">
        <div className="space-y-4">
          <div>
            <Typography variant="subtitle1" fontWeight={600}>
              Select Agentic Service Type
            </Typography>
          </div>
          <FormField
            control={control}
            name="type"
            render={({field}) => (
              <FormItem>
                <FormControl>
                  <div className="card-group">
                    {appTypes.map((appType, index) => (
                      <SharedProvider
                        key={index}
                        {...appType}
                        isSelected={field.value === appType.type}
                        onSelect={(type) => {
                          field.onChange(type);
                          analyticsTrack('ADD_AGENTIC_SERVICE_TYPE_SELECTED', {type});
                        }}
                      />
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
              control={control}
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
              control={control}
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
  );
};
