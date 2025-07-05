/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ReactNode} from 'react';
import {Card, CardContent, CardTitle} from './card';
import {VariantProps, cva} from 'class-variance-authority';
import {cn} from '@/lib/utils';
import {Skeleton} from './skeleton';
import {Typography} from '@mui/material';
import {OverflowTooltip} from '@outshift/spark-design';

const statsCardStyles = cva('gap-4 w-full min-h-20 px-0 pb-0', {
  variants: {
    vertical: {
      true: 'flex flex-col h-full justify-around gap-0',
      false: 'flex flex-wrap items-center gap-4'
    },
    isGrid: {
      true: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      false: 'flex flex-wrap items-center gap-4'
    }
  },
  defaultVariants: {
    vertical: false,
    isGrid: true
  }
});

const StatsCard: React.FC<StatsCardProps> = ({stats, vertical, isGrid, loading, className, callToAction, title, useCard = true}) => {
  if (stats.length === 0) {
    return null;
  }
  if (stats.length > 4) {
    console.error('StatsCard: Too many stats provided. Max is 4.');
  }

  const ContainerComponent = useCard ? Card : 'div';

  return (
    <ContainerComponent className="p-0 w-full rounded-[8px]">
      <div className="flex items-center justify-between w-full px-4">
        {title && <CardTitle className="font-semibold tracking-tight">{title}</CardTitle>}
        {callToAction && <div>{callToAction}</div>}
      </div>
      <CardContent className={cn(statsCardStyles({vertical, isGrid}), className)}>
        {stats.map((stat, i) => (
          <StatDisplay key={i} {...stat} loading={stat.loading || loading} />
        ))}
      </CardContent>
    </ContainerComponent>
  );
};

export const StatDisplay: React.FC<Stat> = ({icon, title, value, description, badge, loading}) => {
  return (
    <div className="flex items-center gap-2 py-3 px-4">
      {icon && <div className="flex-shrink-0 p-2 bg-background-secondary rounded-full">{icon}</div>}
      <div className="flex flex-col space-y-1">
        <Typography variant="body2Semibold">{title}</Typography>
        {loading ? (
          <div className="flex flex-col gap-1">
            <Skeleton className="w-14 h-6" />
            <Skeleton className="w-20 h-2" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Typography variant="body2">
                <OverflowTooltip value={value} someLongText={value} />
              </Typography>
              {badge}
            </div>
            {description && (
              <div>
                <div className="text-sm text-muted-foreground">{description}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export interface Stat {
  icon?: ReactNode;
  title: ReactNode;
  value?: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  loading?: boolean;
}

interface StatsCardProps extends VariantProps<typeof statsCardStyles> {
  useCard?: boolean;
  className?: string;
  stats: Stat[];
  loading?: boolean;
  title?: ReactNode;
  callToAction?: ReactNode;
}

export default StatsCard;
