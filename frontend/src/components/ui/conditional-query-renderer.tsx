/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ReactNode} from 'react';
import React from 'react';
import {LoaderRelative, Loading} from './loading';
import {parseError} from '@/utils/api';
import {EmptyState, EmptyStateProps} from '@outshift/spark-design';
import {cn} from '@/lib/utils';
import {Card} from './card';
import {PlusIcon, RefreshCwIcon} from 'lucide-react';

interface UnreadyStateType {
  nothingtoFetch: boolean;
  fetching: boolean;
  error: boolean;
  empty: boolean;
}

export const ConditionalQueryRenderer: React.FC<React.PropsWithChildren<ConditionalQueryRendererProps>> = ({
  data,
  isLoading,
  error,
  itemName,
  children,
  url,
  customLoader,
  customEmpty,
  customError,
  classNameContainer,
  emptyListStateProps,
  errorListStateProps,
  useRelativeLoader = false,
  isEmpty = false,
  useSkeleton = false,
  useContainer = false,
  enable = true,
  useLoading = true
}) => {
  if (!enable) {
    return <>{children}</>;
  }

  const empty = !data || (Array.isArray(data) && data.length === 0) || isEmpty;
  const unreadyStates: UnreadyStateType = {
    nothingtoFetch: typeof url === 'string' && url.length === 0,
    fetching: isLoading ?? data === undefined,
    error: !!error,
    empty: empty
  };

  const getUnreadyStateUI = (): string | ReactNode | null => {
    if (unreadyStates.nothingtoFetch) {
      return (
        <>
          <span>Error loading {itemName}</span>
          <span>No resource locator provided.</span>
        </>
      );
    } else if (unreadyStates.error) {
      if (customError) {
        return customError;
      }
      return (
        <EmptyState
          title={`Could not load ${itemName}`}
          description={parseError(error) || error}
          variant="negative"
          actionTitle="Retry"
          {...errorListStateProps}
          actionButtonProps={{
            startIcon: <RefreshCwIcon className="w-4 h-4" />,
            variant: 'primary',
            ...errorListStateProps?.actionButtonProps,
            sx: {
              fontWeight: '600 !important',
              ...errorListStateProps?.actionButtonProps?.sx
            }
          }}
          containerProps={{
            sx: {paddingBottom: '32px', ...errorListStateProps?.containerProps?.sx},
            ...errorListStateProps?.containerProps
          }}
        />
      );
    } else if (unreadyStates.fetching && useLoading) {
      // We are fetching
      return customLoader ? customLoader : useRelativeLoader ? <LoaderRelative /> : <Loading />;
    } else if (unreadyStates.empty && !isLoading) {
      if (customEmpty) {
        return customEmpty;
      }
      return (
        <EmptyState
          title={`No ${itemName} found.`}
          description={`There are no ${itemName} available at the moment.`}
          variant="info"
          {...emptyListStateProps}
          actionButtonProps={{
            startIcon: <PlusIcon className="w-4 h-4" />,
            variant: 'outlined',
            ...emptyListStateProps?.actionButtonProps,
            sx: {
              fontWeight: '600 !important',
              ...emptyListStateProps?.actionButtonProps?.sx
            }
          }}
          containerProps={{
            sx: {paddingBottom: '32px', ...emptyListStateProps?.containerProps?.sx},
            ...emptyListStateProps?.containerProps
          }}
        />
      );
    }
    return null;
  };

  const unreadyResult = getUnreadyStateUI();

  if (useContainer && unreadyResult) {
    return (
      <Card
        className={cn(
          'flex flex-col gap-2 items-center p-[24px] bg-[#F5F8FD] w-full h-full',
          classNameContainer,
          useSkeleton
        )}
      >
        <div className="bg-[#F5F8FD] p-[24px] rounded-[8px] w-full h-full justify-center flex flex-col items-center">
          {unreadyResult}
        </div>
      </Card>
    );
  }

  if (unreadyResult) {
    return (
      <div className={cn('flex flex-col gap-2 items-center w-full h-full', classNameContainer, useSkeleton)}>
        <div className="bg-[#F5F8FD] p-[24px] rounded-[8px] w-full h-full justify-center flex flex-col items-center">
          {' '}
          {unreadyResult}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

interface ConditionalQueryRendererProps {
  isLoading?: boolean;
  itemName: string;
  data: unknown;
  error: any;
  url?: string | null;
  customLoader?: ReactNode;
  customEmpty?: ReactNode;
  customError?: ReactNode;
  classNameContainer?: string;
  emptyListStateProps?: Partial<EmptyStateProps>;
  errorListStateProps?: Partial<EmptyStateProps>;
  isEmpty?: boolean;
  useRelativeLoader?: boolean;
  useSkeleton?: boolean;
  useContainer?: boolean;
  enable?: boolean;
  useLoading?: boolean;
}
