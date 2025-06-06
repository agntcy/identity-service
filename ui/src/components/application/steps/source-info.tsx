/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useStepper} from '../stepper';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useEffect, useMemo} from 'react';
import {SharedProvider, SharedProviderProps} from '@/components/shared/shared-provider';
import {Input} from '@/components/ui/input';
import {ApplicationTypes, SourceTypes} from '@/types/applications';
import {SourceInformationFormValues} from '@/schemas/application-schema';
import {ContainerIcon, LinkIcon} from 'lucide-react';
import {GitHubLogoIcon} from '@radix-ui/react-icons';
import {Textarea} from '@/components/ui/textarea';

export const SourceInfo = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, reset, watch} = useFormContext<SourceInformationFormValues>();
  const methods = useStepper();

  const metaDataAppType = methods.getMetadata('applicationType');
  const applicationType = metaDataAppType?.type as ApplicationTypes;

  const metaDataSource = methods.getMetadata('sourceInfo');
  const sourceType = watch('type');

  const sourceTypes: SharedProviderProps<SourceTypes>[] | undefined = useMemo(() => {
    if (applicationType == ApplicationTypes.OASF) {
      return undefined;
    } else {
      return [
        {
          type: SourceTypes.URL,
          name: 'URL',
          details: 'URL for your application source',
          imgURI: <LinkIcon className="w-7 h-7" />,
          isDisabled: isLoading
        },
        {
          type: SourceTypes.DOCKER,
          name: 'Docker',
          details: 'Docker image for your application',
          imgURI: <ContainerIcon className="w-8 h-8" />,
          isDisabled: isLoading
        },
        {
          type: SourceTypes.GIT,
          name: 'Git',
          details: 'Git repository for your application',
          imgURI: <GitHubLogoIcon className="w-8 h-8" />,
          isDisabled: isLoading
        }
      ];
    }
  }, [applicationType, isLoading]);

  useEffect(() => {
    if (metaDataSource) {
      reset({
        type: metaDataSource.type ?? undefined,
        text: metaDataSource.text ?? undefined
      });
    } else {
      reset({
        type: undefined,
        text: undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaDataSource]);

  return (
    <Card className="text-start py-4" variant="secondary">
      <CardContent className="px-4 space-y-4">
        {sourceTypes && applicationType !== ApplicationTypes.OASF && (
          <div className="space-y-2">
            <FormLabel className="text-start font-semibold text-[14px]">1. Source Type</FormLabel>
            <FormField
              control={control}
              name="type"
              render={({field}) => (
                <FormItem>
                  <FormControl>
                    <div className="card-group">
                      {sourceTypes?.map((appType, index) => (
                        <SharedProvider key={index} {...appType} isSelected={field.value === appType.type} onSelect={field.onChange} />
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription className="text-[12px]">Select your source type.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        {applicationType === ApplicationTypes.OASF ? (
          <div className="space-y-2">
            <FormField
              control={control}
              name="text"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="form-label">Specs or SHA</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Insert JSON specs or SHA..." {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : sourceType ? (
          <div className="space-y-2">
            <FormLabel className="text-start font-semibold text-[14px]">2. Source Details</FormLabel>
            <div className="space-y-2">
              <FormField
                control={control}
                name="text"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Source..." {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
