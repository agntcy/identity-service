/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useStepper} from '../stepper';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {useEffect} from 'react';
import {SharedProvider, SharedProviderProps} from '@/components/shared/shared-provider';
import {Input} from '@/components/ui/input';
import {Link, Typography} from '@outshift/spark-design';
import {ExternalLinkIcon} from 'lucide-react';
import {AgenticServiceFormValues} from '@/schemas/agentic-service-schema';
import {AppType} from '@/types/api/app';
import OasfLogo from '@/assets/oasf.svg?react';
import McpLogo from '@/assets/mcp.svg?react';
import {FileUpload} from '@/components/ui/file-upload';

export const AgenticServiceInfo = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, watch, reset} = useFormContext<AgenticServiceFormValues>();
  const methods = useStepper();

  const metaData = methods.getMetadata('agenticServiceInfo') as AgenticServiceFormValues | undefined;

  const appTypes: SharedProviderProps<AppType>[] = [
    {
      type: AppType.APP_TYPE_AGENT_OASF,
      title: 'OASF',
      imgURI: <OasfLogo />,
      isDisabled: isLoading
    },
    {
      type: AppType.APP_TYPE_AGENT_MCP_SERVER,
      title: 'MCP Server',
      imgURI: <McpLogo className="w-5 h-5" />,
      isDisabled: isLoading
    },
    {
      type: AppType.APP_TYPE_AGENT_A2A,
      title: 'Protocol',
      imgURI: <Typography>A2A</Typography>,
      isDisabled: true
    }
  ];

  const appType = watch('type') as AppType;

  useEffect(() => {
    if (metaData) {
      reset({
        type: metaData.type ?? undefined,
        name: metaData.name ?? undefined,
        description: metaData.description ?? undefined,
        oasfSpecs: metaData.oasfSpecs ?? undefined,
        mcpServer: metaData.mcpServer ?? undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaData]);

  return (
    <Card className="text-start py-4 bg-[#F5F8FD] rounded-[8px] p-[24px] space-y-4" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1" fontWeight={600}>
          Agentic Service details
        </Typography>
        <Link href="" openInNewTab>
          <div className="flex items-center gap-1">
            View documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
      <CardContent className="space-y-4 p-0">
        <div className="space-y-2">
          <div className="space-y-2">
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
        </div>
        <div className="space-y-2">
          <div>
            <Typography variant="subtitle1" fontWeight={600}>
              Select Agentic Service type
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
                      <SharedProvider key={index} {...appType} isSelected={field.value === appType.type} onSelect={field.onChange} />
                    ))}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        {appType === AppType.APP_TYPE_AGENT_OASF && (
          <div className="space-y-2 pt-2">
            <FormField
              control={control}
              name="oasfSpecs"
              render={({field}) => (
                <FormItem>
                  <FormControl>
                    <FileUpload {...field} disabled={isLoading} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
        {appType === AppType.APP_TYPE_AGENT_MCP_SERVER && (
          <div className="space-y-2 pt-2">
            <FormField
              control={control}
              name="mcpServer"
              render={({field}) => (
                <FormItem className="w-[50%] pr-2">
                  <FormLabel className="form-label">URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Type the url mcp server..." {...field} disabled={isLoading} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
