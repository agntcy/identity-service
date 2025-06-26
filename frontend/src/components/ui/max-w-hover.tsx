/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ReactNode} from 'react';
import {Tooltip, TooltipContent, TooltipTrigger} from './tooltip';
import {TooltipArrow} from '@radix-ui/react-tooltip';
import {cn} from '@/lib/utils';

const MaxWHover: React.FC<MaxWHoverProps> = ({children, useMarkdown = false, className}) => {
  const defaultMaxW = 'max-w-[10rem]';
  const maxw = className?.split(' ').find((c) => c.startsWith('max-w-')) || defaultMaxW;
  const classNamesWithoutMaxW = className
    ?.split(' ')
    .filter((c) => !c.startsWith('max-w-'))
    .join(' ');

  if (useMarkdown) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              'whitespace-nowrap overflow-hidden text-ellipsis decoration-dotted cursor-default tooltip-trigger-underline cursor-default truncate',
              classNamesWithoutMaxW,
              maxw
            )}
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <TooltipArrow />
          <div className="max-w-xl max-h-64 overflow-auto whitespace-pre-wrap leading-4 text-[13px]">
            {/* <TextMd text={children as string} /> */}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className={cn(
            'whitespace-nowrap overflow-hidden text-ellipsis decoration-dotted cursor-default tooltip-trigger-underline cursor-default truncate',
            classNamesWithoutMaxW,
            maxw
          )}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <TooltipArrow />
        <div className="max-w-xl max-h-64 overflow-auto whitespace-pre-wrap leading-4 text-[13px]">{children}</div>
      </TooltipContent>
    </Tooltip>
  );
};

interface MaxWHoverProps {
  children: ReactNode;
  className?: string;
  useMarkdown?: boolean;
}

export default MaxWHover;
