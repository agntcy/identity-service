/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ReactNode} from 'react';
import {Card} from '../ui/card';
import {cn} from '@/lib/utils';
import {Tooltip, Typography} from '@outshift/spark-design';

export const SharedProvider = <T,>({
  imgURI,
  title,
  isDisabled = false,
  flexGroup = false,
  className,
  infoAction,
  isSelected,
  type,
  useTooltip = true,
  onSelect
}: SharedProviderProps<T>) => {
  if (useTooltip && isDisabled) {
    return (
      <Tooltip title="This option is not available" placement="top">
        <span>
          <Card
            onClick={() => undefined}
            className={cn(
              'border-[#D5DFF7] border-solid border-[2px] py-[8px] px-[16px] rounded-[4px] bg-[#FBFCFE] h-[48px]',
              'flex justify-center w-fit flex-row gap-[12px] items-center cursor-pointer hover:border-[#187ADC] hover:border-[2px] hover:opacity-100',
              isSelected && 'border-[#187ADC] border-[2px]',
              isDisabled && 'opacity-55 cursor-no-drop pointer-events-none',
              flexGroup && 'card-flex-group',
              className
            )}
          >
            {imgURI && imgURI}
            <Typography variant="body1">{title}</Typography>
            {infoAction && <div>{infoAction}</div>}
          </Card>
        </span>
      </Tooltip>
    );
  }
  return (
    <Card
      onClick={() => onSelect?.(type)}
      className={cn(
        'border-[#D5DFF7] border-solid border-[2px] py-[8px] px-[16px] rounded-[4px] bg-[#FBFCFE] h-[48px]',
        'flex justify-center w-fit flex-row gap-[12px] items-center cursor-pointer hover:border-[#187ADC] hover:border-[2px] hover:opacity-100',
        isSelected && 'border-[#187ADC] border-[2px]',
        isDisabled && 'opacity-55 cursor-no-drop pointer-events-none',
        flexGroup && 'card-flex-group',
        className
      )}
    >
      {imgURI && imgURI}
      <Typography variant="body1">{title}</Typography>
      {infoAction && <div>{infoAction}</div>}
    </Card>
  );
};

export interface SharedProviderProps<T> {
  type: T;
  imgURI?: ReactNode;
  title: string;
  flexGroup?: boolean;
  isDisabled?: boolean;
  isSelected?: boolean;
  className?: string;
  infoAction?: ReactNode;
  useTooltip?: boolean;
  onSelect?: (provider: T) => void;
}
