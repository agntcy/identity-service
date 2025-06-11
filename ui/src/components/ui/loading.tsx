/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {cn} from '@/lib/utils';
import {cva, VariantProps} from 'class-variance-authority';

const spinnerSizes = cva('', {
  variants: {
    size: {
      xl: 'w-[64px] h-[64px]',
      lg: 'w-[40px] h-[40px]',
      md: 'w-[24px] h-[24px]',
      sm: 'w-[20px] h-[20px]',
      xs: 'w-[16px] h-[16px]'
    },
    defaultVariants: {
      size: 'xl'
    }
  }
});

export interface SpinnerProps extends VariantProps<typeof spinnerSizes> {
  variant?: 'primary' | 'secondary';
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Spinner = ({size = 'xl', variant = 'primary', strokeWidth = 4, className, style}: SpinnerProps) => {
  return (
    <div className={`relative flex items-center justify-center ${spinnerSizes({size})} ${className}`}>
      {/* Determinate Circle */}
      <div
        className={cn(spinnerSizes({size}), 'absolute rounded-full', variant === 'primary' ? 'border-[#187ADC]' : 'border-[#062242]', className)}
        style={{
          borderWidth: `${strokeWidth}px`,
          opacity: 0.2
        }}
      />
      {/* Indeterminate Circle */}
      <div
        className={cn(
          spinnerSizes({size}),
          'absolute rounded-full animate-spin border-[#187ADC] border-t-transparent border-solid',
          variant === 'primary' ? 'border-[#187ADC]' : 'border-[#062242]',
          className
        )}
        style={{
          borderWidth: `${strokeWidth}px`,
          borderStyle: 'solid',
          borderColor: `${variant === 'primary' ? '#187ADC' : '#062242'} transparent transparent transparent`,
          animationDuration: '1s',
          ...style
        }}
      />
    </div>
  );
};

export interface LoadingProps {
  classNameContainer?: React.CSSProperties;
  spinnerProps?: SpinnerProps;
}

export const Loading = ({classNameContainer, spinnerProps}: LoadingProps) => {
  return (
    <div
      className={cn(
        'flex flex-col justify-center items-center h-full w-full absolute top-[50%] left-[50%] z-[1000] -translate-x-[50%] -translate-y-[50%]',
        classNameContainer
      )}
    >
      <Spinner {...spinnerProps} />
    </div>
  );
};

export const LoaderRelative = ({classNameContainer, spinnerProps}: LoadingProps) => {
  return (
    <div className={cn('flex justify-center items-center w-full', classNameContainer)}>
      <Spinner {...spinnerProps} />
    </div>
  );
};
