/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import * as BadgeApi from '../generated/identity/badge_service.swagger.api';
import {AuthInfo} from '@/types/auth/common';
import config from '@/config';
import {httpErrorsAuth, USER_NOT_AUTH} from '@/constants/http-errors';
import {Badge} from '@/types/api/badge';
import {AnalyticsService} from '@/types/analytics/analytics';

export class BadgeAPIClass extends BadgeApi.Api<Badge> {
  protected authInfo: AuthInfo | null | undefined;
  protected retry = false;
  protected analytics: AnalyticsService | undefined;
  protected tokenExpiredHttpHandler?: () => Promise<AuthInfo | undefined>;
  protected logout?: (params: {
    revokeAccessToken?: boolean;
    revokeRefreshToken?: boolean;
    clearTokensBeforeRedirect?: boolean;
  }) => void;

  public issueBadge = this.v1Alpha1.issueBadge;
  public verifyBadge = this.v1Alpha1.verifyBadge;

  protected handleLogout = () => {
    this.logout?.({
      revokeAccessToken: true,
      revokeRefreshToken: true,
      clearTokensBeforeRedirect: true
    });
  };

  protected reqResInterceptor = (config: InternalAxiosRequestConfig<AxiosHeaders>) => {
    if (this.authInfo?.accessToken?.accessToken) {
      config.headers['Authorization'] = `Bearer ${this.authInfo.accessToken.accessToken}`;
    }
    try {
      if (this.analytics) {
        void this.analytics.track('API_REQUEST', {
          method: config.method,
          url: config.url
        });
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
    return config;
  };

  protected reqErrInterceptor = (error: AxiosError) => Promise.reject(error);

  protected resResInterceptor = (response: AxiosResponse) => response;

  protected resErrInterceptor = async (error: AxiosError) => {
    const originalConfig = error.config;
    if (
      this.authInfo &&
      !this.retry &&
      originalConfig &&
      error.response &&
      httpErrorsAuth.includes(error.response?.status)
    ) {
      this.retry = true;
      const message = (error.response.data as {message?: string}).message;
      if (this.tokenExpiredHttpHandler && !message?.includes(USER_NOT_AUTH)) {
        try {
          const newAuthInfo = await this.tokenExpiredHttpHandler();
          if (newAuthInfo) {
            this.instance.defaults.headers.common['Authorization'] = `Bearer ${newAuthInfo.accessToken?.accessToken}`;
            return this.instance(originalConfig);
          }
          return this.handleLogout();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          return this.handleLogout();
        }
      }
      return this.handleLogout();
    }
    if (!this.authInfo || !this.authInfo.accessToken?.accessToken) {
      return this.handleLogout();
    }
    return Promise.reject(error);
  };

  public setAuthInfo = (authInfo?: AuthInfo) => {
    this.instance.defaults.timeout = 15000; // Set a default timeout of 15 seconds
    this.authInfo = authInfo;
    this.instance.interceptors.request.use(this.reqResInterceptor, this.reqErrInterceptor);
    this.instance.interceptors.response.use(this.resResInterceptor, this.resErrInterceptor);
  };

  public setTokenExpiredHandlers(handlers: {
    tokenExpiredHttpHandler?: () => Promise<AuthInfo | undefined>;
    logout?: (params: {
      revokeAccessToken?: boolean;
      revokeRefreshToken?: boolean;
      clearTokensBeforeRedirect?: boolean;
    }) => void;
  }) {
    this.tokenExpiredHttpHandler = handlers.tokenExpiredHttpHandler;
    this.logout = handlers.logout;
  }

  public setAnalytics = (analytics?: AnalyticsService) => {
    this.analytics = analytics;
  };
}

export const BadgeAPI = new BadgeAPIClass({baseURL: config.API_HOST});
