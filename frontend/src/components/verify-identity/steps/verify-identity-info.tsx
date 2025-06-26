/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useStepper} from '../stepper';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {useEffect} from 'react';
import {Divider, Typography} from '@outshift/spark-design';
import {FileUpload} from '@/components/ui/file-upload';
import {VerifyIdentityFormValues} from '@/schemas/verify-identity-schema';
import {Textarea} from '@/components/ui/textarea';
import {LoaderRelative} from '@/components/ui/loading';

export const VerifyIdentityInfo = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, reset} = useFormContext<VerifyIdentityFormValues>();
  const methods = useStepper();

  const metaData = methods.getMetadata('uploadBadge') as VerifyIdentityFormValues | undefined;

  useEffect(() => {
    if (metaData) {
      reset({
        badgeId: metaData.badgeId || undefined,
        file: metaData.file || undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaData]);

  if (isLoading) {
    return (
      <Card className="text-start py-4 bg-[#F5F8FD] rounded-[8px] p-[24px] space-y-4" variant="secondary">
        <LoaderRelative />
      </Card>
    );
  }

  return (
    <Card className="text-start py-4 rounded-[8px] p-[24px]" variant="secondary">
      <CardContent className="space-y-4 p-0">
        <div>
          <Typography variant="subtitle1" fontWeight={600}>
            Details
          </Typography>
        </div>
        <div className="w-full flex gap-8 items-">
          <div className="py-6 w-[50%]">
            <FormField
              control={control}
              name="file"
              render={({field}) => (
                <FormItem>
                  <FormControl>
                    <FileUpload
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          field.onChange(e.target.files[0]);
                        }
                      }}
                      name={field.name}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div>
            <Divider orientation="vertical" sx={{height: '37%', margin: '0 auto'}} />
            <Typography padding={'16px 0'} variant="subtitle1" color="#1A1F27">
              or
            </Typography>
            <Divider orientation="vertical" sx={{height: '37%', margin: '0 auto'}} />
          </div>
          <div className="py-6 w-[50%]">
            <FormField
              control={control}
              name="badgeId"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="form-label">ID Badge</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Type the ID of the badge..." rows={4} {...field} disabled={isLoading} />
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
