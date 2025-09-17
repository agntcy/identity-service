/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
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
      analyticsPage('VISIT_PAGE', pageTitle, {
        pageTitle: pageTitle
      });
    }
  }, [pageTitle, analyticsPage]);

  return disableErrorBoundary ? (
    getWrappedChildren()
  ) : (
    <ErrorBoundary fallbackRender={(props) => <ErrorPage {...props} />}>{getWrappedChildren()}</ErrorBoundary>
  );
};
