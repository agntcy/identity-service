/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import * as SettingsApi from '../generated/identity/settings_service.swagger.api';
import {AuthInfo} from '@/types/okta';
import config from '@/config';
import {Settings} from '@/types/api/settings';
import {httpErrorsAuth, USER_NOT_AUTH} from '@/constants/http-errors';
import {AnalyticsBrowser} from '@segment/analytics-next';

export class SettingsAPIClass extends SettingsApi.Api<Settings> {
  protected authInfo: AuthInfo | null | undefined;
  protected retry = false;
  protected analytics: AnalyticsBrowser | undefined;
  protected tokenExpiredHttpHandler?: () => Promise<AuthInfo | undefined>;
  protected logout?: (params: {
    revokeAccessToken?: boolean;
    revokeRefreshToken?: boolean;
    clearTokensBeforeRedirect?: boolean;
  }) => void;

  public getSettings = this.v1Alpha1.getSettings;
  public setUpIssuer = this.v1Alpha1.setUpIssuer;
  public settingsServiceSetApiKey = this.v1Alpha1.settingsServiceSetApiKey;

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

  public setAnalytics = (analytics?: AnalyticsBrowser) => {
    this.analytics = analytics;
  };
}

export const SettingsAPI = new SettingsAPIClass({baseURL: config.API_HOST});
