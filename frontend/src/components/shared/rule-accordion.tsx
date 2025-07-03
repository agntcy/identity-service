/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Rule} from '@/types/api/policy';
import {IconButton} from '@mui/material';
import {Accordion, Tooltip} from '@outshift/spark-design';
import {XIcon} from 'lucide-react';

interface RuleAccordionProps {
  rule: Partial<Rule>;
  showCloseButton?: boolean;
  onClose?: (ruleId: string) => void;
}

export const RuleAccordion = ({rule, showCloseButton = false, onClose}: RuleAccordionProps) => {
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="w-full">
        <Accordion title={rule.name || 'Rule'}>
          <div>content</div>
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
