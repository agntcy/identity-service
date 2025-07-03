/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import * as PolicyApi from '../generated/identity/policy_service.swagger.api';
import {AuthInfo} from '@/types/okta';
import config from '@/config';
import {httpErrorsAuth, USER_NOT_AUTH} from '@/constants/http-errors';
import {App} from '@/types/api/app';

class PolicyAPIClass extends PolicyApi.Api<App> {
  protected authInfo: AuthInfo | null | undefined;
  protected retry = false;
  protected tokenExpiredHttpHandler?: () => Promise<AuthInfo | undefined>;
  protected logout?: (params: {revokeAccessToken?: boolean; revokeRefreshToken?: boolean; clearTokensBeforeRedirect?: boolean}) => void;

  public createPolicy = this.v1Alpha1.createPolicy;
  public createRule = this.v1Alpha1.createRule;
  public deletePolicy = this.v1Alpha1.deletePolicy;
  public getPolicy = this.v1Alpha1.getPolicy;
  public getRule = this.v1Alpha1.getRule;
  public listPolicies = this.v1Alpha1.listPolicies;
  public listRules = this.v1Alpha1.listRules;
  public updatePolicy = this.v1Alpha1.updatePolicy;
  public updateRule = this.v1Alpha1.updateRule;

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
    return config;
  };

  protected reqErrInterceptor = (error: AxiosError) => Promise.reject(error);

  protected resResInterceptor = (response: AxiosResponse) => response;

  protected resErrInterceptor = async (error: AxiosError) => {
    const originalConfig = error.config;
    if (this.authInfo && !this.retry && originalConfig && error.response && httpErrorsAuth.includes(error.response?.status)) {
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
    logout?: (params: {revokeAccessToken?: boolean; revokeRefreshToken?: boolean; clearTokensBeforeRedirect?: boolean}) => void;
  }) {
    this.tokenExpiredHttpHandler = handlers.tokenExpiredHttpHandler;
    this.logout = handlers.logout;
  }
}

export const PolicyAPI = new PolicyAPIClass({baseURL: config.API_HOST});
