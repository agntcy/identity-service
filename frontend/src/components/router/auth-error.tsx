/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {FallbackProps} from 'react-error-boundary';
import {EmptyState} from '@open-ui-kit/core';
import {Card} from '../ui/card';

interface ErrorPageProps extends Omit<FallbackProps, 'resetErrorBoundary'> {
  className?: string;
  resetErrorBoundary?: (...args: any[]) => void;
}

export const AuthError: React.FC<ErrorPageProps> = ({error, resetErrorBoundary, ...props}) => {
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message || 'Unknown error occurred';
    }
    if (typeof error === 'string') {
      return error || 'Unknown error occurred';
    }
    console.error(error);
    return 'Unknown error';
  };

  const getErrorName = (error: unknown): string | null => {
    if (error instanceof Error && error.name) {
      return error.name;
    }
    return null;
  };

  const errorMessage = getErrorMessage(error);
  const errorName = getErrorName(error);

  const handleRefresh = () => {
    resetErrorBoundary?.();
  };

  return (
    <Card className="mt-[24px] mx-[32px] p-[24px]" {...props}>
      <EmptyState
        variant="warning"
        title="Something went wrong"
        description={
          (
            <div className="flex flex-col gap-2 text-center text-xs text-muted-foreground mt-2">
              <p>
                <b>Date of error:</b> {new Date().toLocaleString('en-US')}
              </p>
              {errorMessage && errorName ? (
                <p>
                  <b>{errorName}</b>: {errorMessage}
                </p>
              ) : errorMessage ? (
                <p>{errorMessage}</p>
              ) : null}
              <p>Please try refreshing the page, or contact support if the problem persists.</p>
            </div>
          ) as any
        }
        actionTitle="Refresh"
        actionCallback={handleRefresh}
        containerProps={{
          paddingBottom: '40px'
        }}
      />
    </Card>
  );
};
