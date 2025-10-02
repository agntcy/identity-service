/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {cn} from '@/lib/utils';
import {Spinner, SpinnerProps} from '@open-ui-kit/core';

export interface LoadingProps {
  classNameContainer?: React.CSSProperties;
  spinnerProps?: SpinnerProps;
}

export const Loading = ({classNameContainer, spinnerProps}: LoadingProps) => {
  return (
    <div
      className={cn(
        'bg-[#fbfcfe] flex flex-col justify-center items-center h-full w-full fixed top-[50%] left-[50%] z-[5000] -translate-x-[50%] -translate-y-[50%]',
        classNameContainer
      )}
    >
      <Spinner size={64} {...spinnerProps} />
    </div>
  );
};

export const LoaderRelative = ({classNameContainer, spinnerProps}: LoadingProps) => {
  return (
    <div className={cn('flex items-center w-full flex-col justify-center', classNameContainer)}>
      <Spinner boxProps={{style: {display: 'flex'}}} {...spinnerProps} />
    </div>
  );
};
