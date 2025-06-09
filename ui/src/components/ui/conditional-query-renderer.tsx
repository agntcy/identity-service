import type {ReactNode} from 'react';
import React from 'react';
import {LoaderRelative, Loading} from './loading';
import {ExclamationTriangleIcon} from '@radix-ui/react-icons';
import {Card} from './card';
import {parseError} from '@/utils/api';
import EmptyOrErrorListState, {EmptyOrErrorListStateProps} from './empty-or-error-list-state';
import {cn} from '@/lib/utils';

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
  const defaultErrorListStateProps: EmptyOrErrorListStateProps = {
    title: <>Could not load {itemName}</>,
    description: <>{parseError(error) || error}</>,
    icon: <ExclamationTriangleIcon className="w-12 h-12 aspect-square" />
  };

  const defaultEmptyListStateProps: EmptyOrErrorListStateProps = {
    title: <>No {itemName} found.</>
  };

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
      return <EmptyOrErrorListState {...{...defaultErrorListStateProps, ...errorListStateProps}} />;
    } else if (unreadyStates.fetching && useLoading) {
      // We are fetching
      return customLoader ? customLoader : useRelativeLoader ? <LoaderRelative /> : <Loading />;
    } else if (unreadyStates.empty && !isLoading) {
      if (customEmpty) {
        return customEmpty;
      }
      return <EmptyOrErrorListState {...{...defaultEmptyListStateProps, ...emptyListStateProps}} />;
    }
    return null;
  };

  const unreadyResult = getUnreadyStateUI();

  if (useContainer && unreadyResult) {
    return <Card className={cn('flex flex-col gap-2 items-center my-12 px-4', classNameContainer, useSkeleton && 'block p-0')}>{unreadyResult}</Card>;
  }

  if (unreadyResult) {
    return <div className={cn('flex flex-col gap-2 items-center my-12 px-4', classNameContainer, useSkeleton && 'block p-0')}>{unreadyResult}</div>;
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
  emptyListStateProps?: Partial<EmptyOrErrorListStateProps>;
  errorListStateProps?: Partial<EmptyOrErrorListStateProps>;
  isEmpty?: boolean;
  useRelativeLoader?: boolean;
  useSkeleton?: boolean;
  useContainer?: boolean;
  enable?: boolean;
  useLoading?: boolean;
}
