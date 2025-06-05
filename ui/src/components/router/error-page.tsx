/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {FallbackProps} from 'react-error-boundary';
import {useRouteError, isRouteErrorResponse} from 'react-router-dom';
import {BasePage} from '../layout/base-page';
import {Card} from '../ui/card';
import {cn} from '@/lib/utils';
import {ExclamationTriangleIcon} from '@radix-ui/react-icons';
import {Button} from '../ui/button';

interface ErrorPageProps extends Omit<FallbackProps, 'resetErrorBoundary'> {
  className?: string;
  resetErrorBoundary?: (...args: any[]) => void;
}

export const ErrorPage = ({error, className, resetErrorBoundary}: ErrorPageProps) => {
  const errorRouter = useRouteError();
  let errorMessage: string;

  if (isRouteErrorResponse(errorRouter)) {
    errorMessage = error.error?.message || error.statusText;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    console.error(error);
    errorMessage = 'Unknown error';
  }

  return (
    <BasePage useBreadcrumbs={false}>
      <Card className={cn('p-6', className)}>
        <div className="mb-6">
          <div className="p-3 inline-flex items-center align-center rounded-full bg-primary">
            <ExclamationTriangleIcon className="w-10 h-10 text-muted" />
          </div>
        </div>
        <h1 className="text-lg font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">An unexpected error has occurred. Sorry about that!</p>
        <div className="flex flex-col gap-2 text-left text-xs text-muted-foreground mt-2">
          <p>
            <b>Date of error:</b>
            {new Date().toLocaleString()}
          </p>
          {errorMessage && error.name ? (
            <p>
              <b>{error.name}</b>: {errorMessage}
            </p>
          ) : (
            <p>{errorMessage}</p>
          )}
          <p>Please try refreshing the page, or contact support if the problem persists.</p>
          <Button className="w-[100px] mt-6" onClick={() => resetErrorBoundary?.()}>
            Refresh
          </Button>
        </div>
      </Card>
    </BasePage>
  );
};
