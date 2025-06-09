/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';

import {cn} from '@/lib/utils';

export type InputProps = React.ComponentProps<'input'>;

function Input({className, type, ...props}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-[#777D85] selection:bg-primary selection:text-[#3C4551] border-input flex h-9 w-full min-w-0 rounded-[4px] border bg-input px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-[#0051AF] focus-visible:ring-[2px]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        'bg-[#FBFCFE]',
        className
      )}
      autoComplete="off"
      {...props}
    />
  );
}

export {Input};
