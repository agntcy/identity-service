import type {VariantProps} from 'class-variance-authority';
import {cva} from 'class-variance-authority';
import React, {useMemo} from 'react';
import {format, formatDistanceToNow} from 'date-fns';
import {Tooltip, TooltipContent, TooltipTrigger} from './tooltip';
import {safeGetDate} from '@/utils/date';

const dateHoverStyles = cva(['_date-hover inline underline decoration-dotted decoration-text-foreground cursor-default']);

const DateHover: React.FC<DateHoverProps> = ({className, date, ...props}) => {
  const dateObj = useMemo(() => {
    try {
      return safeGetDate(date);
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
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <div className={dateHoverStyles({class: className})} {...props}>
          {props.children || `${formatDistanceToNow(dateObj, {addSuffix: true})}`}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {/* <TooltipArrow /> */}
        <div>{format(dateObj, 'PPPPpppp')}</div>
      </TooltipContent>
    </Tooltip>
  );
};

interface DateHoverProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, VariantProps<typeof dateHoverStyles> {
  date?: string | number | Date;
}

export default DateHover;
