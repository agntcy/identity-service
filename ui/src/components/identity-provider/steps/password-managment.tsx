/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useStepper} from '../stepper';
import {useFormContext} from 'react-hook-form';
import {FormDescription, FormField, FormItem, FormMessage} from '@/components/ui/form';
import PasswordLogo from '@/assets/1password-logo.svg?react';
import {useEffect} from 'react';
import {PasswordManagmentProviderFormValues} from '@/schemas/identity-provider-schema';
import {SharedProvider, SharedProviderProps} from '@/components/shared/shared-provider';
import {PasswordManagmentProviders} from '@/types/providers';
import {BookKeyIcon, FileIcon} from 'lucide-react';

export const PasswordManagment = () => {
  const {control, reset} = useFormContext<PasswordManagmentProviderFormValues>();
  const methods = useStepper();

  const passwordManagers: SharedProviderProps<PasswordManagmentProviders>[] = [
    {
      type: PasswordManagmentProviders.LOCAL_FILE,
      name: 'Local File',
      details: 'Local file storage',
      imgURI: <FileIcon className="w-10 h-10" />
    },
    {
      type: PasswordManagmentProviders.KEY_CHAIN,
      name: 'Key Chain',
      details: 'Key chain storage',
      imgURI: <BookKeyIcon className="w-10 h-10" />
    },
    {
      type: PasswordManagmentProviders.ONE_PASSWORD,
      name: '1Password',
      details: 'Password manager',
      imgURI: <PasswordLogo className="w-12 h-12" />
    }
  ];

  const manager = methods.getMetadata('passwordManagement')?.manager as PasswordManagmentProviders;

  useEffect(() => {
    if (manager) {
      reset({
        manager: manager
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager]);

  return (
    <Card className="text-start py-4" variant="secondary">
      <CardContent className="px-4">
        <FormField
          control={control}
          name="manager"
          render={({field}) => (
            <FormItem>
              <div className="card-group">
                {passwordManagers.map((manager, index) => (
                  <SharedProvider key={index} {...manager} isSelected={field.value === manager.type} onSelect={field.onChange} />
                ))}
                <div className="card-flex-group min-w-[300px] hidden lg:block 2xl:hidden" />
              </div>
              <FormDescription className="text-[12px]">Select your password manager.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
