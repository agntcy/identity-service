/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ReactNode} from 'react';
import {Badge} from './badge';

export const Instructions = ({instructions}: {instructions?: ReactNode[]}) => {
  return (
    <div className="flex-col items-center justify-start space-y-2">
      {instructions?.map((instruction, index) => (
        <div key={index} className="flex items-center content-center gap-2">
          <Badge size="sm" className="rounded-[12px]">
            {index + 1}
          </Badge>
          <p className="flex gap-1 items-center text-sm">{instruction}</p>
        </div>
      ))}
    </div>
  );
};
