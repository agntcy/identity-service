/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ReactNode} from 'react';
import {Card, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {cn} from '@/lib/utils';

export const SharedProvider = <T,>({imgURI, name, details, isDisabled = false, isSelected, type, onSelect}: SharedProviderProps<T>) => {
  return (
    <Card
      onClick={() => (!isDisabled ? onSelect?.(type) : undefined)}
      className={cn(
        'bg-[#FBFCFE] opacity-85 text-[0.875rem] flex justify-between max-w-[225px] w-full flex-row items-center rounded-lg gap-[0.625rem] cursor-pointer hover:outline-1 hover:outline hover:opacity-100',
        isSelected && 'opacity-100 outline border-solid',
        isDisabled && 'opacity-55 cursor-no-drop pointer-events-none',
        'min-w-[300px]',
        'card-flex-group',
        'p-3'
      )}
    >
      <CardHeader className="p-0">
        <CardTitle>{name}</CardTitle>
        {details && <CardDescription>{details}</CardDescription>}
      </CardHeader>
      {imgURI && imgURI}
    </Card>
  );
};

export interface SharedProviderProps<T> {
  type: T;
  imgURI?: ReactNode;
  name: string;
  details?: string;
  isDisabled?: boolean;
  isSelected?: boolean;
  onSelect?: (provider: T) => void;
}
