/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {useCallback, useEffect} from 'react';
import {Divider, toast, Typography} from '@outshift/spark-design';
import {FileUpload} from '@/components/ui/file-upload';
import {VerifyIdentityFormValues} from '@/schemas/verify-identity-schema';
import {Textarea} from '@/components/ui/textarea';
import {parseJwt} from '@/utils/utils';

export const VerifyIdentityForm = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, watch, reset, setValue, setError} = useFormContext<VerifyIdentityFormValues>();

  const badge = watch('badge');
  const badgeContent = watch('badgeContent');

  const onConvertHandle = useCallback(
    (content?: ArrayBuffer) => {
      try {
        if (content) {
          const decodedContent = new TextDecoder().decode(content);
          const VC = JSON.parse(decodedContent);
          const proofValue = (VC.proof?.proofValue || VC?.proofValue || VC) as string | undefined;
          const decodeJwt = parseJwt(proofValue || '');
          if (proofValue && decodeJwt) {
            setValue('badgeContent', JSON.stringify(decodedContent));
            setValue('proofValue', proofValue);
          } else {
            setError('badgeContent', {
              type: 'manual',
              message: 'The uploaded file does not contain a valid badge.'
            });
            toast({
              title: 'Invalid Badge',
              description: 'The uploaded file does not contain a valid badge.',
              type: 'error'
            });
          }
        }
      } catch (error) {
        setError('badgeContent', {
          type: 'manual',
          message: 'There was an error processing the file. Please ensure it is a valid badge JSON.'
        });
        toast({
          title: 'Error processing file',
          description: 'There was an error processing the file. Please ensure it is a valid badge JSON.',
          type: 'error'
        });
      }
    },
    [setError, setValue]
  );

  useEffect(() => {
    if (badge) {
      try {
        const VC = JSON.parse(badge);
        const proofValue = (VC.proof?.proofValue || VC?.proofValue || VC) as string | undefined;
        const decodeJwt = parseJwt(proofValue || '');
        if (proofValue && decodeJwt) {
          setValue('proofValue', proofValue);
        } else {
          setError('badgeContent', {
            type: 'manual',
            message: 'The field does not contain a valid badge.'
          });
          toast({
            title: 'Invalid Badge',
            description: 'The field does not contain a valid badge.',
            type: 'error'
          });
        }
      } catch (error) {
        const proofValue = badge;
        setValue('proofValue', proofValue);
      }
    }
  }, [badge, setError, setValue]);

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
                      disabled={isLoading || !!badge}
                      defaultFile={field.value}
                      ref={field.ref}
                      name={field.name}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        field.onChange(file ? file : undefined);
                      }}
                      onConvert={onConvertHandle}
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
          <div className="w-[50%] my-auto">
            <FormField
              control={control}
              name="badge"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="form-label">Badge</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none h-[124px]"
                      placeholder="The JOSE enveloped badge to verify"
                      rows={3}
                      {...field}
                      disabled={isLoading || !!badgeContent}
                    />
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
