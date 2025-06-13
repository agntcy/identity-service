/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ReactNode} from 'react';
import React from 'react';
import {MagnifyingGlassIcon} from '@radix-ui/react-icons';

const EmptyOrErrorListState: React.FC<EmptyOrErrorListStateProps> = ({title, description, icon, actions, ...props}) => {
  return (
    <div className="flex items-center flex-col gap-2 text-muted-foreground text-center" {...props}>
      <div>{icon ?? <MagnifyingGlassIcon className="w-8 h-8 aspect-square" />}</div>
      <h2 className="font-semibold text-lg text-foreground">{title}</h2>
      {description && <div className="font-normal text-sm mb-4">{description}</div>}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export interface EmptyOrErrorListStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  description?: ReactNode;
  actions?: ReactNode;
  title: ReactNode;
  icon?: ReactNode;
}

export default EmptyOrErrorListState;
