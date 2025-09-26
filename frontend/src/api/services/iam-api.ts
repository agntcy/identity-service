/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import axios, {AxiosError, AxiosHeaders, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {AuthConfigIAM} from '@/types/auth/iam';
import {httpErrorsAuth} from '@/constants/http-errors';
import {
  GetGroupsTenantResponse,
  GetSessionResponse,
  GetTenantsResponse,
  GetUsersGroupsResponse,
  InviteUserPayload,
  TenantReponse
} from '@/types/api/iam';
import {AnalyticsService} from '@/types/analytics/analytics';
import {getAuthConfig} from '@/utils/auth';
import {AuthInfo} from '@/types/auth/common';

export class IamAPIClass {
  protected authInfo: AuthInfo | null | undefined;
  public instance: AxiosInstance;
  protected retry = false;
  protected analytics: AnalyticsService | undefined;
  protected tokenExpiredHttpHandler?: () => Promise<AuthInfo | undefined>;
  protected logout?: (params: {
    revokeAccessToken?: boolean;
    revokeRefreshToken?: boolean;
    clearTokensBeforeRedirect?: boolean;
  }) => void;

  protected authConfig = getAuthConfig() as AuthConfigIAM | undefined;

  constructor() {
    this.instance = axios.create({
      baseURL: this.authConfig?.iamApi,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  public getSession = () => {
    return this.instance.get<GetSessionResponse>('/session');
  };

  public getUsersGroups = (groupId: string) => {
    return this.instance.get<GetUsersGroupsResponse>(`/user`, {
      params: {
        group: groupId
      }
    });
  };

  public getGroupsTenant = (tenantId: string) => {
    return this.instance.get<GetGroupsTenantResponse>(`/tenant/${tenantId}/group`);
  };

  public getTenants = () => {
    return this.instance.get<GetTenantsResponse>('/tenant', {
      params: {
        product: this.authConfig?.productId
      }
    });
  };

  public getTenant = (tenantId: string) => {
    return this.instance.get<TenantReponse>(`/tenant/${tenantId}`);
  };

  public createTenant = () => {
    return this.instance.post<TenantReponse>('/tenant/user', undefined, {
      params: {
        product: this.authConfig?.productId
      }
    });
  };

  public updateTenant = (id: string, name: string) => {
    const payload = {name};
    return this.instance.put<TenantReponse>(`/tenant/${id}`, payload);
  };

  public deleteTenant = (id: string) => {
    return this.instance.delete<TenantReponse>(`/tenant/${id}`);
  };

  public inviteUser = (groupId: string, data: InviteUserPayload) => {
    return this.instance.post(`/user/request/invite`, data, {
      params: {
        product: this.authConfig?.productId,
        group: groupId
      }
    });
  };

  public deleteUser = (userId: string, tenantId: string) => {
    const payload = {username: userId};
    return this.instance.delete(`/tenant/${tenantId}/user`, {data: payload});
  };

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
      if (this.tokenExpiredHttpHandler) {
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

export const IamAPI = new IamAPIClass();
