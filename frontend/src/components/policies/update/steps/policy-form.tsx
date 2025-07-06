/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useStepper} from '../stepper';
import {useFormContext} from 'react-hook-form';
import {FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form';
import {useEffect, useMemo} from 'react';
import {Input} from '@/components/ui/input';
import {GeneralSize, MenuItem, Select, Tag, Typography} from '@outshift/spark-design';
import {PlusIcon} from 'lucide-react';
import {PolicyFormValues} from '@/schemas/policy-schema';
import {Textarea} from '@/components/ui/textarea';
import {useGetAgenticServices} from '@/queries';
import {Button, Divider, Skeleton} from '@mui/material';
import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';

export const PolicyForm = ({isLoading = false}: {isLoading?: boolean}) => {
  const {control, reset, formState} = useFormContext<PolicyFormValues>();
  const methods = useStepper();

  const {data, isLoading: isLoadingAgenticServices, isError} = useGetAgenticServices();

  const metaData = methods.getMetadata('policyForm') as PolicyFormValues | undefined;

  const navigate = useNavigate();

  const agenticServices = useMemo(() => {
    return data?.apps ?? [];
  }, [data]);

  const optionAgenticServices = useMemo(() => {
    return agenticServices.map((service) => ({
      label: service.name ?? 'Unknown Service',
      value: service.id ?? '',
      icon: <AgenticServiceType type={service.type} className="h-[20px] w-[20px]" showLabel={false} />
    }));
  }, [agenticServices]);

  useEffect(() => {
    if (metaData) {
      reset({
        name: metaData.name ?? undefined,
        description: metaData.description ?? undefined,
        assignedTo: metaData.assignedTo ?? undefined
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
              Details
            </Typography>
          </div>
          <div className="flex items-start gap-6">
            <div className="space-y-4 w-[50%]">
              <FormField
                control={control}
                name="name"
                render={({field}) => (
                  <FormItem>
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
                  <FormItem>
                    <FormLabel className="form-label">Description</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none" rows={4} placeholder="Type the description..." {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="w-[50%]">
              {isLoadingAgenticServices || isError ? (
                <Skeleton sx={{marginTop: '14px', height: '60px'}} />
              ) : (
                <FormField
                  control={control}
                  name="assignedTo"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="form-label">Assigned To</FormLabel>
                      <FormControl>
                        <Select
                          disabled={isLoading}
                          fullWidth
                          label="Select Agentic Service"
                          variant="standard"
                          displayEmpty
                          sx={{
                            height: '36px',
                            marginTop: 0,
                            '&.MuiInputBase-root': {backgroundColor: '#FBFCFE', marginTop: 0, border: '2px solid #E8EEFB'},
                            '& .MuiSelect-select': {backgroundColor: '#fbfcfe', color: '#777D85'},
                            '& .MuiSelect-icon': {
                              color: 'currentColor'
                            }
                          }}
                          renderValue={(select: any) => {
                            if (!select) {
                              return (
                                <Typography variant="body2" fontSize={14} sx={(theme) => ({color: theme.palette.vars.baseTextWeak})}>
                                  Select agentic service...
                                </Typography>
                              );
                            }
                            return (
                              <div className="mb-[2px]">
                                <Tag size={GeneralSize.Small} icon={optionAgenticServices.find((option) => option.value === select)?.icon}>
                                  {optionAgenticServices.find((option) => option.value === select)?.label}
                                </Tag>
                              </div>
                            );
                          }}
                          error={formState.errors.assignedTo ? true : false}
                          {...field}
                        >
                          {optionAgenticServices.length === 0 && (
                            <MenuItem value="" disabled>
                              <div className="flex items-center gap-2">
                                <Skeleton variant="circular" width={20} height={20} />
                                <Typography variant="body2" fontSize={14} sx={(theme) => ({color: theme.palette.vars.baseTextWeak})}>
                                  No agentic services available
                                </Typography>
                              </div>
                            </MenuItem>
                          )}
                          {optionAgenticServices.map((option, key) => (
                            <MenuItem key={key} value={option.value}>
                              <Typography variant="body2">
                                <div className="flex items-center gap-2">
                                  {option.icon}
                                  {option.label}
                                </div>
                              </Typography>
                            </MenuItem>
                          ))}
                          <Divider />
                          <div className="px-4">
                            <Button
                              startIcon={<PlusIcon className="h-4 w-4" />}
                              variant="tertariary"
                              onClick={() => {
                                void navigate(PATHS.agenticServices.create, {replace: true});
                              }}
                            >
                              Add Agentic Service
                            </Button>
                          </div>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
