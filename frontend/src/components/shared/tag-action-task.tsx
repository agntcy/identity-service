/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Tag, TagProps} from '@outshift/spark-design';
import {RuleAction} from '@/types/api/policy';
import {BanIcon, CheckIcon} from 'lucide-react';

interface TagActionTaskProps extends TagProps {
  action: RuleAction;
  task: string;
}

export const TagActionTask = ({action, task, ...props}: TagActionTaskProps) => {
  if (action === RuleAction.RULE_ACTION_ALLOW) {
    return (
      <Tag {...props} icon={<CheckIcon className="w-4 h-4" />}>
        {task}
      </Tag>
    );
  } else if (action === RuleAction.RULE_ACTION_DENY) {
    return (
      <Tag {...props} icon={<BanIcon className="w-4 h-4" />}>
        {task}
      </Tag>
    );
  }
  return <Tag {...props}>{task}</Tag>;
};
