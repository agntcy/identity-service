/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Suspense, useEffect} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {ErrorPage} from './error-page';
import {Loading} from '@/components/ui/loading';
import {useAnalytics} from '@/hooks';

export interface NodeRouteProps {
  children: React.ReactNode;
  disableErrorBoundary?: boolean;
  pageTitle?: string;
}

export const NodeRoute = ({children, disableErrorBoundary, pageTitle}: NodeRouteProps) => {
  const getWrappedChildren = () => <Suspense fallback={<Loading />}>{children}</Suspense>;

  const {analyticsPage} = useAnalytics();

  useEffect(() => {
    if (pageTitle && analyticsPage) {
      analyticsPage('VISIT_PAGE', {
        pageTitle: pageTitle
      });
    }
  }, [analyticsPage, pageTitle]);

  return disableErrorBoundary ? (
    getWrappedChildren()
  ) : (
    <ErrorBoundary fallbackRender={(props) => <ErrorPage {...props} />}>{getWrappedChildren()}</ErrorBoundary>
  );
};
