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

export const VerifyIdentityForm = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, watch, reset, setValue} = useFormContext<VerifyIdentityFormValues>();
  const methods = useStepper();

  const metaData = methods.getMetadata('verifyIdentityForm') as VerifyIdentityFormValues | undefined;

  const badgeId = watch('badgeId');
  const badgeContent = watch('badgeContent');

  useEffect(() => {
    if (metaData) {
      reset({
        badgeId: metaData.badgeId || undefined,
        badgeFile: metaData.badgeFile || undefined,
        badgeContent: metaData.badgeContent || undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaData]);

  return (
    <Card className="text-start py-4 rounded-[8px] p-[24px]" variant="secondary">
      <CardContent className="space-y-4 p-0">
        <div>
          <Typography variant="subtitle1" fontWeight={600}>
            Details
          </Typography>
        </div>
        <div className="w-full flex gap-8">
          <div className="py-12 w-[50%]">
            <FormField
              control={control}
              name="badgeFile"
              render={({field}) => (
                <FormItem>
                  <FormControl>
                    <FileUpload
                      disabled={isLoading || !!badgeId}
                      defaultFile={field.value}
                      ref={field.ref}
                      name={field.name}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        field.onChange(file ? file : undefined);
                      }}
                      onConvert={(content) => {
                        setValue('badgeContent', content ? new TextDecoder().decode(content) : undefined);
                      }}
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
                    <Textarea placeholder="Type the ID of the badge..." rows={3} {...field} disabled={isLoading || !!badgeContent} />
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
