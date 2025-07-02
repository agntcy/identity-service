/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {FallbackProps} from 'react-error-boundary';
import {EmptyState} from '@outshift/spark-design';
import {Card} from '../ui/card';

interface ErrorPageProps extends Omit<FallbackProps, 'resetErrorBoundary'> {
  className?: string;
  resetErrorBoundary?: (...args: any[]) => void;
}

export const AuthError = ({error, resetErrorBoundary}: ErrorPageProps) => {
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    console.error(error);
    errorMessage = 'Unknown error';
  }

  return (
    <Card className="mt-[24px] mx-[32px] p-[24px]" variant="secondary">
      <EmptyState
        variant="warning"
        title="Something went wrong"
        description={
          (
            <div className="flex flex-col gap-2 text-center text-xs text-muted-foreground mt-2">
              <p>
                <b>Date of error:</b> {new Date().toLocaleString()}
              </p>
              {errorMessage && error.name ? (
                <p>
                  <b>{error.name}</b>: {errorMessage}
                </p>
              ) : (
                <p>{errorMessage}</p>
              )}
              <p>Please try refreshing the page, or contact support if the problem persists.</p>
            </div>
          ) as any
        }
        actionTitle="Refresh"
        actionCallback={() => resetErrorBoundary?.()}
        containerProps={{paddingBottom: '40px'}}
      />
    </Card>
  );
};
