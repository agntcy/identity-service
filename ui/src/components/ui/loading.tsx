/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {cn} from '@/lib/utils';
import {LoaderCircleIcon} from 'lucide-react';

export interface LoadingProps {
  style?: React.CSSProperties;
  classNameLoader?: string;
}

export const Loading = ({style, classNameLoader}: LoadingProps) => {
  return (
    <div
      className="flex flex-col justify-center items-center h-full w-full absolute top-[50%] left-[50%] z-[1000] -translate-x-[50%] -translate-y-[50%]"
      style={style}
    >
      <LoaderCircleIcon className={cn('w-20 h-20 animate-spin stroke-[#00142B]', classNameLoader)} />
    </div>
  );
};

export const LoaderRelative = ({className}: {className?: string}) => {
  return (
    <div className={cn('flex justify-center items-center w-full', className)}>
      <LoaderCircleIcon className={'w-10 h-10 animate-spin stroke-[#00142B]'} />
    </div>
  );
};
