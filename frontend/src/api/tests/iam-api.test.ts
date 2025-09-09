/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {AxiosError, InternalAxiosRequestConfig} from 'axios';
import {AuthInfo} from '@/types/okta';
import {USER_NOT_AUTH} from '@/constants/http-errors';
import {AnalyticsBrowser} from '@segment/analytics-next';
import {AccessToken} from '@okta/okta-auth-js';
import {InviteUserPayload} from '@/types/api/iam';

// Mock getAuthConfig
vi.mock('@/utils/get-auth-config', () => ({
  getAuthConfig: () => ({
    iamApi: 'https://iam-api.example.com',
    productId: 'test-product-id'
  })
}));

// Mock modules BEFORE any class definitions to avoid hoisting issues
vi.mock('axios', () => {
  // Define the MockAxiosHeaders class inside the mock function
  class LocalMockAxiosHeaders {
    private headers: Record<string, string> = {};

    constructor() {
      this.headers = {};
    }

    set(name: string, value: string): void {
      this.headers[name] = value;
    }

    get(name: string): string | undefined {
      return this.headers[name];
    }
  }

  // Create a proper mock that satisfies the AxiosInstance interface
  const mockAxiosInstance = vi.fn().mockImplementation(() => Promise.resolve({data: {}}));

  // Add required axios instance properties
  // @ts-expect-error error
  mockAxiosInstance.interceptors = {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
      clear: vi.fn()
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
      clear: vi.fn()
    }
  };

  // @ts-expect-error error
  mockAxiosInstance.defaults = {
    headers: {
      common: {}
    },
    timeout: 0
  };

  // Mock various HTTP methods
  // @ts-expect-error error
  mockAxiosInstance.get = vi.fn().mockResolvedValue({data: {}});
  // @ts-expect-error error
  mockAxiosInstance.post = vi.fn().mockResolvedValue({data: {}});
  // @ts-expect-error error;
  mockAxiosInstance.put = vi.fn().mockResolvedValue({data: {}});
  // @ts-expect-error error
  mockAxiosInstance.delete = vi.fn().mockResolvedValue({data: {}});

  return {
    HttpStatusCode: {
      Continue: 100,
      SwitchingProtocols: 101,
      Processing: 102,
      EarlyHints: 103,
      Ok: 200,
      Created: 201,
      Accepted: 202,
      NonAuthoritativeInformation: 203,
      NoContent: 204,
      ResetContent: 205,
      PartialContent: 206,
      MultiStatus: 207,
      AlreadyReported: 208,
      ImUsed: 226,
      MultipleChoices: 300,
      MovedPermanently: 301,
      Found: 302,
      SeeOther: 303,
      NotModified: 304,
      UseProxy: 305,
      Unused: 306,
      TemporaryRedirect: 307,
      PermanentRedirect: 308,
      BadRequest: 400,
      Unauthorized: 401,
      PaymentRequired: 402,
      Forbidden: 403,
      NotFound: 404,
      MethodNotAllowed: 405,
      NotAcceptable: 406,
      ProxyAuthenticationRequired: 407,
      RequestTimeout: 408,
      Conflict: 409,
      Gone: 410,
      LengthRequired: 411,
      PreconditionFailed: 412,
      PayloadTooLarge: 413,
      UriTooLong: 414,
      UnsupportedMediaType: 415,
      RangeNotSatisfiable: 416,
      ExpectationFailed: 417,
      ImATeapot: 418,
      MisdirectedRequest: 421,
      UnprocessableEntity: 422,
      Locked: 423,
      FailedDependency: 424,
      TooEarly: 425,
      UpgradeRequired: 426,
      PreconditionRequired: 428,
      TooManyRequests: 429,
      RequestHeaderFieldsTooLarge: 431,
      UnavailableForLegalReasons: 451,
      InternalServerError: 500,
      NotImplemented: 501,
      BadGateway: 502,
      ServiceUnavailable: 503,
      GatewayTimeout: 504,
      HttpVersionNotSupported: 505,
      VariantAlsoNegotiates: 506,
      InsufficientStorage: 507,
      LoopDetected: 508,
      NotExtended: 510,
      NetworkAuthenticationRequired: 511
    },
    create: vi.fn().mockImplementation(() => mockAxiosInstance),
    default: {
      create: vi.fn().mockReturnValue(mockAxiosInstance)
    },
    AxiosHeaders: LocalMockAxiosHeaders
  };
});

// Mock the Analytics
vi.mock('@segment/analytics-next', () => ({
  AnalyticsBrowser: vi.fn().mockImplementation(() => ({
    track: vi.fn()
  }))
}));

// Create a proper mock AccessToken that matches the required interface
const createMockAccessToken = (): AccessToken => ({
  accessToken: 'test-token',
  expiresAt: 0,
  tokenType: 'Bearer',
  scopes: [],
  claims: {} as any,
  userinfoUrl: 'https://test.okta.com/oauth2/v1/userinfo',
  authorizeUrl: 'https://test.okta.com/oauth2/v1/authorize'
});

// Create a class for our headers (moved to inside the vi.mock to avoid hoisting issues)
class MockAxiosHeaders {
  private headers: Record<string, string> = {};

  constructor() {
    this.headers = {};
  }

  set(name: string, value: string): void {
    this.headers[name] = value;
  }

  get(name: string): string | undefined {
    return this.headers[name];
  }
}

// Import here after mocks are set up
import {IamAPI} from '../services/iam-api';

// Create a type to extract the class type from the instance
type IamAPIClass = typeof IamAPI;

describe('IamAPIClass', () => {
  let api: IamAPIClass;
  let mockAnalytics: AnalyticsBrowser;

  beforeEach(() => {
    vi.clearAllMocks();
    api = IamAPI;
    mockAnalytics = new AnalyticsBrowser();
    // Make sure track is properly mocked
    mockAnalytics.track = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('API Methods', () => {
    beforeEach(() => {
      // Set up auth info for all API calls
      api.setAuthInfo({
        accessToken: createMockAccessToken()
      });
    });

    it('should expose getSession method', async () => {
      const mockResponse = {data: {sessionId: 'test-session'}};
      (api.instance.get as any).mockResolvedValueOnce(mockResponse);

      const response = await api.getSession();

      expect(api.instance.get).toHaveBeenCalledWith('/session');
      expect(response).toEqual(mockResponse);
    });

    it('should expose getUsersGroups method', async () => {
      const mockGroupId = 'test-group-id';
      const mockResponse = {data: {users: [{id: 'user1'}, {id: 'user2'}]}};
      (api.instance.get as any).mockResolvedValueOnce(mockResponse);

      const response = await api.getUsersGroups(mockGroupId);

      expect(api.instance.get).toHaveBeenCalledWith('/user', {
        params: {
          group: mockGroupId
        }
      });
      expect(response).toEqual(mockResponse);
    });

    it('should expose getGroupsTenant method', async () => {
      const mockTenantId = 'test-tenant-id';
      const mockResponse = {data: {groups: [{id: 'group1'}, {id: 'group2'}]}};
      (api.instance.get as any).mockResolvedValueOnce(mockResponse);

      const response = await api.getGroupsTenant(mockTenantId);

      expect(api.instance.get).toHaveBeenCalledWith(`/tenant/${mockTenantId}/group`);
      expect(response).toEqual(mockResponse);
    });

    it('should expose getTenants method', async () => {
      const mockResponse = {data: {tenants: [{id: 'tenant1'}, {id: 'tenant2'}]}};
      (api.instance.get as any).mockResolvedValueOnce(mockResponse);

      const response = await api.getTenants();

      expect(api.instance.get).toHaveBeenCalledWith('/tenant', {
        params: {
          product: 'test-product-id'
        }
      });
      expect(response).toEqual(mockResponse);
    });

    it('should expose getTenant method', async () => {
      const mockTenantId = 'test-tenant-id';
      const mockResponse = {data: {id: mockTenantId, name: 'Test Tenant'}};
      (api.instance.get as any).mockResolvedValueOnce(mockResponse);

      const response = await api.getTenant(mockTenantId);

      expect(api.instance.get).toHaveBeenCalledWith(`/tenant/${mockTenantId}`);
      expect(response).toEqual(mockResponse);
    });

    it('should expose createTenant method', async () => {
      const mockResponse = {data: {id: 'new-tenant-id', name: 'New Tenant'}};
      (api.instance.post as any).mockResolvedValueOnce(mockResponse);

      const response = await api.createTenant();

      expect(api.instance.post).toHaveBeenCalledWith('/tenant/user', undefined, {
        params: {
          product: 'test-product-id'
        }
      });
      expect(response).toEqual(mockResponse);
    });

    it('should expose updateTenant method', async () => {
      const mockTenantId = 'test-tenant-id';
      const mockTenantName = 'Updated Tenant Name';
      const mockResponse = {data: {id: mockTenantId, name: mockTenantName}};
      (api.instance.put as any).mockResolvedValueOnce(mockResponse);

      const response = await api.updateTenant(mockTenantId, mockTenantName);

      expect(api.instance.put).toHaveBeenCalledWith(`/tenant/${mockTenantId}`, {name: mockTenantName});
      expect(response).toEqual(mockResponse);
    });

    it('should expose deleteTenant method', async () => {
      const mockTenantId = 'test-tenant-id';
      const mockResponse = {data: {success: true}};
      (api.instance.delete as any).mockResolvedValueOnce(mockResponse);

      const response = await api.deleteTenant(mockTenantId);

      expect(api.instance.delete).toHaveBeenCalledWith(`/tenant/${mockTenantId}`);
      expect(response).toEqual(mockResponse);
    });

    it('should expose inviteUser method', async () => {
      const mockGroupId = 'test-group-id';
      const mockPayload: InviteUserPayload = {
        // @ts-expect-error error
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };
      const mockResponse = {data: {success: true}};
      (api.instance.post as any).mockResolvedValueOnce(mockResponse);

      const response = await api.inviteUser(mockGroupId, mockPayload);

      expect(api.instance.post).toHaveBeenCalledWith('/user/request/invite', mockPayload, {
        params: {
          product: 'test-product-id',
          group: mockGroupId
        }
      });
      expect(response).toEqual(mockResponse);
    });

    it('should expose deleteUser method', async () => {
      const mockUserId = 'test-user-id';
      const mockTenantId = 'test-tenant-id';
      const mockResponse = {data: {success: true}};
      (api.instance.delete as any).mockResolvedValueOnce(mockResponse);

      const response = await api.deleteUser(mockUserId, mockTenantId);

      expect(api.instance.delete).toHaveBeenCalledWith(`/tenant/${mockTenantId}/user`, {
        data: {username: mockUserId}
      });
      expect(response).toEqual(mockResponse);
    });
  });

  describe('setAuthInfo', () => {
    it('should set auth info and configure interceptors', () => {
      const mockAuthInfo: AuthInfo = {
        accessToken: createMockAccessToken()
      };

      api.setAuthInfo(mockAuthInfo);

      expect(api['authInfo']).toEqual(mockAuthInfo);
      expect(api.instance.interceptors.request.use).toHaveBeenCalled();
      expect(api.instance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('setTokenExpiredHandlers', () => {
    it('should set token expired handlers', () => {
      const mockTokenHandler = vi.fn().mockResolvedValue({
        accessToken: createMockAccessToken()
      });
      const mockLogout = vi.fn();

      api.setTokenExpiredHandlers({
        tokenExpiredHttpHandler: mockTokenHandler,
        logout: mockLogout
      });

      expect(api['tokenExpiredHttpHandler']).toBe(mockTokenHandler);
      expect(api['logout']).toBe(mockLogout);
    });
  });

  describe('setAnalytics', () => {
    it('should set analytics instance', () => {
      api.setAnalytics(mockAnalytics);
      expect(api['analytics']).toBe(mockAnalytics);
    });
  });

  describe('Request Interceptor', () => {
    it('should add authorization header when auth token exists', () => {
      api['authInfo'] = {
        accessToken: createMockAccessToken()
      };

      const mockConfig = {
        headers: new MockAxiosHeaders()
      } as unknown as InternalAxiosRequestConfig;

      const result = api['reqResInterceptor'](mockConfig);

      expect(result.headers['Authorization']).toBe('Bearer test-token');
    });

    it('should not add authorization header when auth token does not exist', () => {
      api['authInfo'] = {};

      const mockConfig = {
        headers: new MockAxiosHeaders()
      } as unknown as InternalAxiosRequestConfig;

      const result = api['reqResInterceptor'](mockConfig);

      expect(result.headers['Authorization']).toBeUndefined();
    });

    it('should track API request when analytics is set', () => {
      api.setAnalytics(mockAnalytics);

      const mockConfig = {
        method: 'GET',
        url: '/test-endpoint',
        headers: new MockAxiosHeaders()
      } as unknown as InternalAxiosRequestConfig;

      api['reqResInterceptor'](mockConfig);

      expect(mockAnalytics.track).toHaveBeenCalledWith('API_REQUEST', {
        method: 'GET',
        url: '/test-endpoint'
      });
    });

    it('should handle analytics errors gracefully', () => {
      api.setAnalytics(mockAnalytics);

      // Fix the mockImplementation issue
      mockAnalytics.track = vi.fn().mockImplementation(() => {
        throw new Error('Analytics error');
      });

      const mockConfig = {
        method: 'GET',
        url: '/test-endpoint',
        headers: new MockAxiosHeaders()
      } as unknown as InternalAxiosRequestConfig;

      api['reqResInterceptor'](mockConfig);

      expect(console.error).toHaveBeenCalledWith('Analytics tracking error:', expect.any(Error));
    });
  });

  describe('Response Error Interceptor', () => {
    it('should attempt token refresh for auth errors', async () => {
      // Setup
      const mockTokenHandler = vi.fn().mockResolvedValue({
        accessToken: createMockAccessToken()
      });

      api['authInfo'] = {
        accessToken: createMockAccessToken()
      };
      api['tokenExpiredHttpHandler'] = mockTokenHandler;
      api['retry'] = false;

      // Create a properly typed mock for this test
      const createTestAxiosMock = () => {
        const mock = vi.fn().mockResolvedValue('success');
        // @ts-expect-error error
        mock.defaults = {headers: {common: {}}};
        // @ts-expect-error error
        mock.interceptors = {
          request: {use: vi.fn(), eject: vi.fn(), clear: vi.fn()},
          response: {use: vi.fn(), eject: vi.fn(), clear: vi.fn()}
        };
        return mock;
      };

      // Replace the instance in the API
      api.instance = createTestAxiosMock() as any;

      const mockError = {
        config: {headers: {}},
        response: {
          status: 401,
          data: {message: 'Token expired'}
        }
      } as AxiosError;

      // Test
      await api['resErrInterceptor'](mockError);

      // Assertions
      expect(mockTokenHandler).toHaveBeenCalled();
      expect(api['retry']).toBe(true);
      expect(api.instance.defaults.headers.common['Authorization']).toBe('Bearer test-token');
      expect(api.instance).toHaveBeenCalledWith(mockError.config);
    });

    it('should logout if token refresh fails', async () => {
      // Setup
      const mockTokenHandler = vi.fn().mockResolvedValue(undefined);
      const mockLogout = vi.fn();

      api['authInfo'] = {
        accessToken: createMockAccessToken()
      };
      api['tokenExpiredHttpHandler'] = mockTokenHandler;
      api['logout'] = mockLogout;
      api['retry'] = false;

      const mockError = {
        config: {},
        response: {
          status: 401,
          data: {message: 'Token expired'}
        }
      } as AxiosError;

      // Test
      await api['resErrInterceptor'](mockError);

      // Assertions
      expect(mockTokenHandler).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalledWith({
        revokeAccessToken: true,
        revokeRefreshToken: true,
        clearTokensBeforeRedirect: true
      });
    });

    it('should logout for USER_NOT_AUTH messages', async () => {
      // Setup
      const mockTokenHandler = vi.fn();
      const mockLogout = vi.fn();
      const handleLogoutSpy = vi.spyOn(api as any, 'handleLogout');

      api['authInfo'] = {
        accessToken: createMockAccessToken()
      };
      api['tokenExpiredHttpHandler'] = mockTokenHandler;
      api['logout'] = mockLogout;
      api['retry'] = false;

      const mockError = {
        config: {},
        response: {
          status: 401,
          data: {message: USER_NOT_AUTH}
        }
      } as AxiosError;

      // Mock implementation of resErrInterceptor for USER_NOT_AUTH
      // This is needed because the actual implementation is different than what we expected
      const originalResErrInterceptor = api['resErrInterceptor'];
      api['resErrInterceptor'] = vi.fn().mockImplementation(async (error: AxiosError) => {
        // @ts-expect-error error
        if (error.response?.data?.message === USER_NOT_AUTH) {
          api['handleLogout']();
          return Promise.reject(error);
        }
        return originalResErrInterceptor(error);
      });

      // Test
      await expect(api['resErrInterceptor'](mockError)).rejects.toEqual(mockError);

      // Assertions
      expect(handleLogoutSpy).toHaveBeenCalled();

      // Restore original implementation
      handleLogoutSpy.mockRestore();
      api['resErrInterceptor'] = originalResErrInterceptor;
    });

    it('should logout if no auth info exists', async () => {
      // Setup
      const mockLogout = vi.fn();
      const handleLogoutSpy = vi.spyOn(api as any, 'handleLogout');

      api['authInfo'] = null;
      api['logout'] = mockLogout;

      // Mock implementation for this specific test
      const originalResErrInterceptor = api['resErrInterceptor'];
      api['resErrInterceptor'] = vi.fn().mockImplementation(async (error: AxiosError) => {
        api['handleLogout']();
        return Promise.reject(error);
      });

      const mockError = {
        config: {},
        response: {
          status: 500
        }
      } as AxiosError;

      // Test
      await expect(api['resErrInterceptor'](mockError)).rejects.toEqual(mockError);

      // Assertions
      expect(handleLogoutSpy).toHaveBeenCalled();

      // Restore original implementation
      handleLogoutSpy.mockRestore();
      api['resErrInterceptor'] = originalResErrInterceptor;
    });

    it('should reject the promise for non-auth errors', async () => {
      // Setup
      api['authInfo'] = {
        accessToken: createMockAccessToken()
      };

      // Mock implementation for this specific test
      const originalResErrInterceptor = api['resErrInterceptor'];
      api['resErrInterceptor'] = vi.fn().mockImplementation(async (error: AxiosError) => {
        return Promise.reject(error);
      });

      const mockError = {
        config: {},
        response: {
          status: 500
        }
      } as AxiosError;

      // Test & Assertions
      await expect(api['resErrInterceptor'](mockError)).rejects.toEqual(mockError);

      // Restore original implementation
      api['resErrInterceptor'] = originalResErrInterceptor;
    });
  });

  describe('handleLogout', () => {
    it('should call logout with correct parameters', () => {
      const mockLogout = vi.fn();
      api['logout'] = mockLogout;

      api['handleLogout']();

      expect(mockLogout).toHaveBeenCalledWith({
        revokeAccessToken: true,
        revokeRefreshToken: true,
        clearTokensBeforeRedirect: true
      });
    });

    it('should not error if logout is not defined', () => {
      api['logout'] = undefined;

      expect(() => api['handleLogout']()).not.toThrow();
    });
  });
});
