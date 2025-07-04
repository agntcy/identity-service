/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {IconButton} from '@mui/material';
import {Accordion, Tooltip} from '@outshift/spark-design';
import {XIcon} from 'lucide-react';
import {RuleFormValues} from '@/schemas/rule-schema';

interface RuleAccordionProps {
  rule: RuleFormValues & {id: string};
  showCloseButton?: boolean;
  onClose?: (ruleId: string) => void;
}

export const RuleAccordion = ({rule, showCloseButton = false, onClose}: RuleAccordionProps) => {
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="w-full">
        <Accordion title={rule.name || 'Rule'}>
          <div className="mt-4 pl-8">
            {/* <Form {...form}>
              <RuleForm />
            </Form> */}
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
