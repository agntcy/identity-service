/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {RuleFormValues, RuleSchema} from '@/schemas/rule-schema';
import {zodResolver} from '@hookform/resolvers/zod';
import {IconButton} from '@mui/material';
import {Accordion, Tooltip} from '@outshift/spark-design';
import {XIcon} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {Form} from '../ui/form';
import {RuleForm} from './rule-form';
import {Rule} from '@/types/api/policy';

interface RuleAccordionProps<T extends Partial<Rule>> {
  rule: T;
  showCloseButton?: boolean;
  onClose?: (ruleId: string) => void;
}

export const RuleAccordion = <T extends Rule>({rule, showCloseButton = false, onClose}: RuleAccordionProps<T>) => {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(RuleSchema),
    mode: 'all'
  });

  return (
    <div className="flex justify-between items-start gap-4">
      <div className="w-full">
        <Accordion title={rule.name || 'Rule'}>
          <div className="mt-4 pl-8">
            <Form {...form}>
              <RuleForm values={rule} />
            </Form>
          </div>
        </Accordion>
      </div>
      {showCloseButton && (
        <Tooltip title="Remove this rule">
          <IconButton
            sx={(theme) => ({
              color: theme.palette.vars.baseTextDefault,
              width: '24px',
              height: '24px'
            })}
            onClick={() => onClose?.(rule.id || '')}
          >
            <XIcon className="h-4 w-4" />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};
