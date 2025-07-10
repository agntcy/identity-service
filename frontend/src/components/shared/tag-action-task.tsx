/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {GeneralSize, Tag, TagProps, TagStatus, Typography} from '@outshift/spark-design';
import {RuleAction} from '@/types/api/policy';
import React from 'react';

interface TagActionTaskProps extends Omit<TagProps, 'children'> {
  action?: RuleAction;
  text?: React.ReactNode;
}

export const TagActionTask = ({action, text, ...props}: TagActionTaskProps) => {
  if (action === RuleAction.RULE_ACTION_ALLOW) {
    return (
      <Tag size={GeneralSize.Medium} status={TagStatus.Allow} {...props}>
        <Typography variant="captionSemibold">{text}</Typography>
      </Tag>
    );
  } else if (action === RuleAction.RULE_ACTION_DENY) {
    return (
      <Tag size={GeneralSize.Medium} status={TagStatus.Deny} {...props}>
        <Typography variant="captionSemibold">{text}</Typography>
      </Tag>
    );
  }
  return (
    <Tag size={GeneralSize.Medium} {...props}>
      {text}
    </Tag>
  );
};
