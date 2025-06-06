/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useStepper} from '../stepper';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useEffect} from 'react';
import {SharedProvider, SharedProviderProps} from '@/components/shared/shared-provider';
import MCPLogo from '@/assets/mcp.svg?react';
import A2ALogo from '@/assets/a2a.png';
import OASFLogo from '@/assets/oasf.svg?react';
import {ApplicationTypes} from '@/types/applications';
import {ApplicationTypeFormValues} from '@/schemas/application-schema';

export const ApplicationType = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, reset} = useFormContext<ApplicationTypeFormValues>();
  const methods = useStepper();

  const applicationTypes: SharedProviderProps<ApplicationTypes>[] = [
    {
      type: ApplicationTypes.OASF,
      name: 'OASF',
      details: 'Open Agentic Schema Framework',
      imgURI: <OASFLogo className="w-10 h-10" />,
      isDisabled: isLoading
    },
    {
      type: ApplicationTypes.MCP,
      name: 'MCP',
      details: 'Model Context Protocol',
      imgURI: <MCPLogo className="w-8 h-8" />,
      isDisabled: isLoading
    },
    {
      type: ApplicationTypes.A2A,
      name: 'A2A',
      details: 'Application to Application',
      imgURI: <img src={A2ALogo} className="w-10 h-10" />,
      isDisabled: isLoading
    }
  ];

  const metaData = methods.getMetadata('applicationType');

  useEffect(() => {
    if (metaData) {
      reset({
        type: metaData.type ?? undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaData]);

  return (
    <Card className="text-start py-4" variant="secondary">
      <CardContent className="px-4 space-y-4">
        <div className="space-y-2">
          <FormLabel className="text-start font-semibold text-[14px]">Type</FormLabel>
          <FormField
            control={control}
            name="type"
            render={({field}) => (
              <FormItem>
                <FormControl>
                  <div className="card-group">
                    {applicationTypes.map((appType, index) => (
                      <SharedProvider key={index} {...appType} isSelected={field.value === appType.type} onSelect={field.onChange} />
                    ))}
                  </div>
                </FormControl>
                <FormDescription className="text-[12px]">Select your application type.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
