/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {AgenticServicesAPIClass} from '../services/agentic-services-api';
import {AxiosError, InternalAxiosRequestConfig} from 'axios';
import {AuthInfo} from '@/types/okta';
import config from '@/config';
import {USER_NOT_AUTH} from '@/constants/http-errors';
import {AnalyticsBrowser} from '@segment/analytics-next';
import {AccessToken} from '@okta/okta-auth-js';

// Mock modules BEFORE any class definitions to avoid hoisting issues
// This needs to be done before any references to MockAxiosHeaders
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
    default: {
      create: vi.fn().mockReturnValue(mockAxiosInstance)
    },
    AxiosHeaders: LocalMockAxiosHeaders
  };
});

// Mock the AgenticServiceApi
vi.mock('../generated/identity/app_service.swagger.api', () => {
  // Create an axios instance mock with proper typing
  const createAxiosMock = () => {
    const axiosFn = vi.fn().mockResolvedValue({data: {}});

    // Add required axios properties
    // @ts-expect-error error
    axiosFn.defaults = {
      headers: {
        common: {}
      },
      timeout: 0
    };

    // @ts-expect-error error
    axiosFn.interceptors = {
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

    return axiosFn;
  };

  return {
    Api: class MockApi {
      v1Alpha1 = {
        getApp: vi.fn(),
        createApp: vi.fn(),
        deleteApp: vi.fn(),
        updateApp: vi.fn(),
        listApps: vi.fn(),
        getAppsCount: vi.fn(),
        getAppBadge: vi.fn(),
        getTasks: vi.fn(),
        refreshAppApiKey: vi.fn()
      };

      instance = createAxiosMock();

      constructor() {
        return this;
      }
    }
  };
});

// Mock the Analytics
vi.mock('@segment/analytics-next', () => ({
  AnalyticsBrowser: vi.fn().mockImplementation(() => ({
    track: vi.fn()
  }))
}));

// Mock config
vi.mock('@/config', () => ({
  default: {
    API_HOST: 'https://test-api.example.com'
  }
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

describe('AgenticServicesAPIClass', () => {
  let api: AgenticServicesAPIClass;
  let mockAnalytics: AnalyticsBrowser;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new AgenticServicesAPIClass({baseURL: config.API_HOST});
    mockAnalytics = new AnalyticsBrowser();
    // Make sure track is properly mocked
    mockAnalytics.track = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initialization', () => {
    it('should create an instance with the correct base URL', () => {
      expect(api).toBeInstanceOf(AgenticServicesAPIClass);
    });

    it('should expose API methods from v1Alpha1', () => {
      expect(api.getApp).toBeDefined();
      expect(api.createApp).toBeDefined();
      expect(api.deleteApp).toBeDefined();
      expect(api.updateApp).toBeDefined();
      expect(api.listApps).toBeDefined();
      expect(api.getAppsCount).toBeDefined();
      expect(api.getAppBadge).toBeDefined();
      expect(api.getTasks).toBeDefined();
      expect(api.refreshAppApiKey).toBeDefined();
    });
  });

  describe('setAuthInfo', () => {
    it('should set auth info and configure interceptors', () => {
      const mockAuthInfo: AuthInfo = {
        accessToken: createMockAccessToken()
      };

      api.setAuthInfo(mockAuthInfo);

      expect(api['authInfo']).toEqual(mockAuthInfo);
      expect(api['instance'].defaults.timeout).toBe(15000);
      expect(api['instance'].interceptors.request.use).toHaveBeenCalled();
      expect(api['instance'].interceptors.response.use).toHaveBeenCalled();
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
      api['instance'] = createTestAxiosMock() as any;

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
      expect(api['instance'].defaults.headers.common['Authorization']).toBe('Bearer test-token');
      expect(api['instance']).toHaveBeenCalledWith(mockError.config);
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

      // Test
      await api['resErrInterceptor'](mockError);

      // Assertions
      expect(mockTokenHandler).not.toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should logout if no auth info exists', async () => {
      // Setup
      const mockLogout = vi.fn();

      api['authInfo'] = null;
      api['logout'] = mockLogout;

      const mockError = {
        config: {},
        response: {
          status: 500
        }
      } as AxiosError;

      // Test
      await api['resErrInterceptor'](mockError);

      // Assertions
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should reject the promise for non-auth errors', async () => {
      // Setup
      api['authInfo'] = {
        accessToken: createMockAccessToken()
      };

      const mockError = {
        config: {},
        response: {
          status: 500
        }
      } as AxiosError;

      // Test & Assertions
      await expect(api['resErrInterceptor'](mockError)).rejects.toEqual(mockError);
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
