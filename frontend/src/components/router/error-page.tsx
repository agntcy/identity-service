/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {FallbackProps} from 'react-error-boundary';
import {isRouteErrorResponse, useRouteError} from 'react-router-dom';
import {EmptyState} from '@cisco-eti/spark-design';
import {Card} from '../ui/card';

interface ErrorPageProps extends Omit<FallbackProps, 'resetErrorBoundary'> {
  className?: string;
  resetErrorBoundary?: (...args: any[]) => void;
}

export const ErrorPage = ({error, resetErrorBoundary}: ErrorPageProps) => {
  const errorRouter = useRouteError();
  let errorMessage: string;
  let actualError: any = error;

  // Prioritize route error if it's a route error response
  if (isRouteErrorResponse(errorRouter)) {
    errorMessage = errorRouter.data || errorRouter.statusText;
    actualError = errorRouter;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    console.error(error);
    errorMessage = 'Unknown error';
  }

  // Get error name safely - only for Error instances
  const errorName = actualError instanceof Error && actualError.name && actualError.name.trim() ? actualError.name : null;

  return (
    <Card className="mt-[24px] mx-[32px] p-[24px]" variant="secondary">
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
        actionCallback={() => resetErrorBoundary?.()}
        containerProps={{paddingBottom: '40px'}}
      />
    </Card>
  );
};
