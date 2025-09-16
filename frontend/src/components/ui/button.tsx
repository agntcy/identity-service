/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@/lib/utils';

const buttonVariants = cva(
  // " aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-[4px] transition-all disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[24px] shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer focus-visible:border-ring focus-visible:ring-[#187ADC] focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        primary:
          'button-text text-[16px] bg-[#187ADC] text-[#E8E9EA] shadow-xs text-[#E8E9EA] hover:bg-[#79B9FF] disabled:bg-[#0051AF66] disabled:text-[#E8F1FF]',
        secondary:
          'button-text text-[16px] bg-[#062242] text-[#E8E9EA] shadow-xs hover:bg-[#263B62] disabled:bg-[#00142B66] disabled:text-[#FBFCFE]',
        outline:
          'button-text text-[16px] border-2 border-[#FBAB2C] text-[#00142B] bg-transparent hover:border-[#FFD7A2] hover:text-[#0D274D] disabled:border-[#FBAF4566] disabled:text-[#777D85]',
        tertariary: 'button-text text-[16px] bg-transparent text-[#187ADC] hover:text-[#79B9FF] disabled:text-[#0051AF66]',
        destructive:
          'button-text text-[16px] bg-[#C0244C] text-[#E8E9EA] shadow-xs hover:bg-[#CF496D] disabled:bg-[#C6295366] disabled:text-[#F8E5EA]',
        ghost: 'button-text text-[16px] hover:bg-accent hover:text-accent-foreground',
        link: 'button-text text-[16px] text-primary underline-offset-4 hover:underline'
      },
      size: {
        lg: 'h-[40px] px-[16px] py-[10px]',
        md: 'h-[32px] px-4 py-[7px]',
        sm: 'h-[24px] px-[12px] py-[3px]',
        icon: "h-[32px] w-[32px] [&_svg:not([class*='size-'])]:size-[18px]"
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'lg'
    }
  }
);

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

function Button({className, variant, size, asChild = false, isLoading = false, ...props}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp data-slot="button" className={cn(buttonVariants({variant, size, className}), isLoading && '')} {...props}>
      {/* {isLoading && (
        <Spinner
          className={cn(variant !== 'outline' && 'border-[#E8E9EA]', variant === 'tertariary' && 'border-[#187ADC]')}
          size="md"
          variant={variant === 'outline' ? 'secondary' : 'primary'}
          style={
            variant === 'primary' || variant === 'secondary' || variant === 'destructive'
              ? {borderColor: '#E8E9EA transparent transparent transparent'}
              : {}
          }
        />
      )} */}
      {!isLoading && <>{props.children}</>}
    </Comp>
  );
}

export {Button, buttonVariants};
