/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {FallbackProps} from 'react-error-boundary';
import {EmptyState} from '@open-ui-kit/core';
import {Card} from '../ui/card';

interface ErrorPageBoundaryProps extends Omit<FallbackProps, 'resetErrorBoundary'> {
  className?: string;
  resetErrorBoundary?: (...args: any[]) => void;
}

export const ErrorPageBoundary = ({error, resetErrorBoundary}: ErrorPageBoundaryProps) => {
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    console.error(error);
    errorMessage = 'Unknown error';
  }

  const errorName = error instanceof Error && error.name ? error.name : null;

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
