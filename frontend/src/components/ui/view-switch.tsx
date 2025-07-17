/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {VariantProps, cva} from 'class-variance-authority';
import {Button, ButtonProps} from './button';
import {cn} from '@/lib/utils';

const viewSwitchVariants = cva([
  'inline-flex items-center rounded-md w-auto h-[34px]',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'bg-destructive text-destructive-foreground'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
]);

const ViewSwitch = React.forwardRef<HTMLDivElement, ViewSwitchProps>(
  ({className, views = [], activeIdx = 0, ...props}, ref) => {
    return (
      <div className={cn(viewSwitchVariants({className}))} ref={ref} {...props}>
        {views.map((view, i) => {
          const isActive = i === activeIdx;
          return (
            <Button
              {...view}
              key={`view-switch-${i}-${view.id}`}
              variant="secondary"
              className={cn(
                'first:rounded-l-md last:rounded-r-md rounded-none min-h-[30px] h-[30px]',
                'border-solid border-2 border-[#DAE3F8]',
                'border-r-0 border-l-0 first:border-l-2 last:border-r-2',
                'font-semibold text-[12px] bg-[#FBFCFE] text-[#3C4551] hover:bg-[#E8EEFB] hover:text-[#00142B]',
                i < activeIdx && 'border-l-2',
                i > activeIdx && 'border-r-2',
                isActive && 'border-[#FB962E] border-r-2 border-l-2',
                view.className
              )}
            />
          );
        })}
      </div>
    );
  }
);
ViewSwitch.displayName = 'Button';

interface ViewSwitchProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof viewSwitchVariants> {
  views: ButtonProps[];
  activeIdx?: number;
}

export default ViewSwitch;
