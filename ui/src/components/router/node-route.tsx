/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Suspense} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {ErrorPage} from './error-page';
import {Loading} from '@/components/ui/loading';

export interface NodeRouteProps {
  children: React.ReactNode;
  disableErrorBoundary?: boolean;
}

export const NodeRoute = ({children, disableErrorBoundary}: NodeRouteProps) => {
  const getWrappedChildren = () => <Suspense fallback={<Loading style={{background: 'none'}} />}>{children}</Suspense>;
  return disableErrorBoundary ? (
    getWrappedChildren()
  ) : (
    <ErrorBoundary fallbackRender={(props) => <ErrorPage {...props} />}>{getWrappedChildren()}</ErrorBoundary>
  );
};
