/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {RuleForm} from '@/components/shared/rule-form';
import {Card, CardContent} from '@/components/ui/card';
import {Form} from '@/components/ui/form';
import {cn, validateForm} from '@/lib/utils';
import {RuleFormValues, RuleSchema} from '@/schemas/rule-schema';
import {CreateRuleBody} from '@/types/api/policy';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button, Divider} from '@mui/material';
import {GripVerticalIcon, PlusIcon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {useForm} from 'react-hook-form';
import z from 'zod';
import lodash from 'lodash';
import {RuleAccordion} from '@/components/shared/rule-accordion';
import {DragDropContext, Droppable, Draggable} from '@hello-pangea/dnd';

export const PolicyLogic = ({isLoading = false}: {isLoading?: boolean}) => {
  const [rules, setRules] = useState<CreateRuleBody & {id: string}[]>([]);
  const hasRules = rules.length > 0;

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(RuleSchema),
    mode: 'all'
  });

  const addRule = useCallback((rule: CreateRuleBody) => {
    const data = {
      ...rule,
      id: lodash.uniqueId('rule_')
    };
    setRules((prevRules) => [...prevRules, data]);
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setRules((prevRules) => prevRules.filter((rule) => rule.id !== ruleId));
  }, []);

  const resetForm = useCallback(() => {
    form.reset({
      name: '',
      description: '',
      action: '',
      task: '',
      needsApproval: 'no'
    });
  }, [form]);

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

  const onSubmit = () => {
    const values = form.getValues();
    const validationResult = validateForm(RuleSchema, values);
    if (!validationResult.success) {
      validationResult.errors?.forEach((error) => {
        const fieldName = error.path[0] as keyof z.infer<typeof RuleSchema>;
        form.setError(fieldName, {type: 'manual', ...error});
      });
      return;
    }
    // TODO: check what do do with actions and tasks
    addRule({
      name: values.name,
      description: values.description,
      needsApproval: values.needsApproval === 'yes',
      tasks: []
    });
    resetForm();
  };

  return (
    <Card className="text-start py-4 rounded-[8px] p-[24px]" variant="secondary">
      <CardContent className="p-0 space-y-6">
        {hasRules &&
          (rules.length > 1 ? (
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
                            <div className={`mt-4 ${index !== rules.length - 1 ? 'pb-10' : ''}`}>
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
                <div className={`mt-4 ${index !== rules.length - 1 ? 'pb-10' : 'pb-4'}`}>
                  <Divider />
                </div>
              </div>
            ))
          ))}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className={cn(hasRules ? 'mt-10' : 'mt-0')}>
              <RuleForm isLoading={isLoading} />
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
                  disabled={isLoading || !form.formState.isValid}
                  onClick={onSubmit}
                >
                  Add Logic
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
