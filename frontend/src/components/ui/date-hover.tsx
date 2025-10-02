/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import type {VariantProps} from 'class-variance-authority';
import {cva} from 'class-variance-authority';
import React, {useMemo} from 'react';
import {format, formatDistanceToNow} from 'date-fns';
import {safeGetDate} from '@/utils/date';
import {Tooltip} from '@mui/material';

const dateHoverStyles = cva(['_date-hover inline cursor-default']);

const DateHover: React.FC<DateHoverProps> = ({className, date, ...props}) => {
  const dateObj = useMemo(() => {
    try {
      return safeGetDate(date);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return null;
    }
  }, [date]);

  if (!date) {
    return null;
  }

  if (!dateObj) {
    // If we can't parse the date, just show the raw date.  This is probably a
    // string that's not a date, like "now" or "today", or a number that's not
    // a timestamp.
    return (
      <span className={dateHoverStyles({class: className})} {...props}>
        {props.children || (date as string | number)}
      </span>
    );
  }

  return (
    <Tooltip arrow title={<div>{format(dateObj, 'PPPPpppp')}</div>}>
      <div className={dateHoverStyles({class: className})} {...props}>
        {props.children || `${formatDistanceToNow(dateObj, {addSuffix: true})}`}
      </div>
    </Tooltip>
  );
};

interface DateHoverProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
    VariantProps<typeof dateHoverStyles> {
  date?: string | number | Date;
}

export default DateHover;
