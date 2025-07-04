/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Form} from '@/components/ui/form';
import {cn, validateForm} from '@/lib/utils';
import {RuleFormValues, RuleSchema} from '@/schemas/rule-schema';
import {zodResolver} from '@hookform/resolvers/zod';
import {GripVerticalIcon, PlusIcon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {useForm} from 'react-hook-form';
import z from 'zod';
import lodash from 'lodash';
import {RuleAccordion} from '@/components/shared/rule-accordion';
import {DragDropContext, Droppable, Draggable} from '@hello-pangea/dnd';
import {useStepper} from '../stepper';
import {RuleForm} from '@/components/shared/rule-form';
import {Button, Divider} from '@mui/material';

export const PolicyLogic = ({isLoading = false}: {isLoading?: boolean}) => {
  const [rules, setRules] = useState<(RuleFormValues & {id: string})[]>([]);

  const methods = useStepper();

  const ruleForm = useForm<RuleFormValues>({
    resolver: zodResolver(RuleSchema),
    mode: 'all',
    defaultValues: {
      name: '',
      description: '',
      needsApproval: 'no',
      tasks: [
        {
          task: '',
          action: ''
        }
      ]
    }
  });

  const handleResetForm = useCallback(() => {
    ruleForm.reset({
      name: '',
      description: '',
      needsApproval: 'no',
      tasks: [
        {
          task: '',
          action: ''
        }
      ]
    });
  }, [ruleForm]);

  const addRule = useCallback((rule: RuleFormValues) => {
    const data = {
      ...rule,
      id: lodash.uniqueId('rule_')
    };
    setRules((prevRules) => [...prevRules, data]);
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setRules((prevRules) => prevRules.filter((rule) => rule.id !== ruleId));
  }, []);

  const onDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) {
        return;
      }
      const reorderedRules = Array.from(rules);
      const [movedRule] = reorderedRules.splice(Number(result.source.index), 1);
      reorderedRules.splice(Number(result.destination.index), 0, movedRule);
      setRules(reorderedRules);
    },
    [rules]
  );

  // const onSubmit = useCallback(() => {
  //   const values = ruleForm.getValues();
  //   const validationResult = validateForm(RuleSchema, values);
  //   if (!validationResult.success) {
  //     validationResult.errors?.forEach((error) => {
  //       const fieldName = error.path[0] as keyof z.infer<typeof RuleSchema>;
  //       ruleForm.setError(fieldName, {type: 'manual', ...error});
  //     });
  //     return;
  //   }
  //   console.log('onSubmit', values);
  // }, [ruleForm]);

  // useEffect(() => {
  //   methods.setMetadata('policyLogic', {
  //     rules: rules
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [rules]);

  const handleAddRule = useCallback(() => {
    const values = ruleForm.getValues();
    const validationResult = validateForm(RuleSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof RuleSchema>;
        ruleForm.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    addRule({
      name: values.name,
      description: values.description,
      needsApproval: values.needsApproval,
      tasks: values.tasks
    });
    handleResetForm();
  }, [addRule, handleResetForm, ruleForm]);

  return (
    <Card className="text-start py-4 rounded-[8px] p-[24px]" variant="secondary">
      <CardContent className="p-0 space-y-6">
        {/* {rules.length > 1 ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="rules">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {rules.map((rule, index) => (
                    <Draggable key={rule.id} draggableId={rule.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}>
                          <div className="flex items-start gap-4">
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVerticalIcon className="w-[20px] h-[20px] -ml-1 mt-1 text-[#9EA2A8]" />
                            </div>
                            <div className="w-full">
                              <RuleAccordion rule={rule} showCloseButton onClose={removeRule} />
                            </div>
                          </div>
                          <div className={`mt-8 ${index !== rules.length - 1 ? 'pb-10' : ''}`}>
                            <Divider />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          rules.map((rule, index) => (
            <div key={rule.id}>
              <div className="flex items-start gap-4">
                <div className="w-full">
                  <RuleAccordion rule={rule} showCloseButton onClose={removeRule} />
                </div>
              </div>
              <div className={`mt-8 ${index !== rules.length - 1 && 'pb-10'}`}>
                <Divider />
              </div>
            </div>
          ))
        )}
        <Form {...ruleForm}>
          <div className={cn(rules.length > 0 ? 'mt-10' : 'mt-0')}>
            <RuleForm isLoading={isLoading} control={ruleForm.control} />
            <div className="mt-8">
              <Divider />
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="tertariary"
                sx={{fontWeight: '600 !important'}}
                startIcon={<PlusIcon className="w-4 h-4" />}
                loading={isLoading}
                loadingPosition="start"
                disabled={isLoading || !ruleForm.formState.isValid}
                onClick={handleAddRule}
              >
                Add Logic
              </Button>
            </div>
          </div>
        </Form> */}
      </CardContent>
    </Card>
  );
};
