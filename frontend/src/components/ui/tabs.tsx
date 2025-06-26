/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {VariantProps, cva} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('inline-flex items-center text-muted-foreground', {
  variants: {
    variant: {
      default: ['border-b'],
      secondary: 'bg-muted p-1 text-muted-foreground w-auto rounded-lg h-[35px]'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-b-[3px] border-transparent hover:border-b-border font-semibold text-[#3C4551]',
  {
    variants: {
      variant: {
        default: 'data-[state=active]:bg-background-secondary data-[state=active]:text-[#041930] data-[state=active]:border-[#041930]',
        outline:
          'border-none inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-[#041930] data-[state=active]:shadow'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>, VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(({className, variant, ...props}, ref) => (
  <TabsPrimitive.List ref={ref} className={cn(tabsListVariants({variant, className}))} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>, VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(({className, variant, ...props}, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={cn(tabsTriggerVariants({variant, className}))} {...props} />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  ({className, ...props}, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  )
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export {Tabs, TabsList, TabsTrigger, TabsContent};
