/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';

import {cn} from '@/lib/utils';

interface CardProps {
  loading?: boolean;
  error?: any;
  isEmpty?: boolean;
  variant?: 'primary' | 'secondary';
}

function Card({className, variant = 'primary', loading, isEmpty, error, ...props}: React.ComponentProps<'div'> & CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        variant === 'primary' && 'text-card-foreground shadow-sm border flex flex-col rounded-xl border py-6 bg-[#FBFCFE]',
        variant === 'secondary' && 'flex flex-col rounded-xl border bg-[#F5F8FD] border-none rounded-[8px] p-[24px]',
        'card-style',
        className,
        loading || isEmpty || error ? 'h-fit' : ''
      )}
      {...props}
    />
  );
}

function CardHeader({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 w-full',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('leading-none font-semibold', className)} {...props} />;
}

function CardDescription({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function CardAction({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-action" className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)} {...props} />;
}

function CardContent({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />;
}

function CardFooter({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center px-6 [.border-t]:pt-6', className)} {...props} />;
}

export {Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent};
