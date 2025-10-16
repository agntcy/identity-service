/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/**
 * App Type
 * - APP_TYPE_UNSPECIFIED: Unspecified Envelope Type.
 *  - APP_TYPE_AGENT_A2A: Agent A2A App Type.
 *  - APP_TYPE_AGENT_OASF: Agent OASF App Type.
 *  - APP_TYPE_MCP_SERVER: Agent MCP Server App Type.
 * @default "APP_TYPE_UNSPECIFIED"
 */
export enum V1Alpha1AppType {
  APP_TYPE_UNSPECIFIED = 'APP_TYPE_UNSPECIFIED',
  APP_TYPE_AGENT_A2A = 'APP_TYPE_AGENT_A2A',
  APP_TYPE_AGENT_OASF = 'APP_TYPE_AGENT_OASF',
  APP_TYPE_MCP_SERVER = 'APP_TYPE_MCP_SERVER'
}

/**
 * - APP_STATUS_UNSPECIFIED: Unspecified status
 *  - APP_STATUS_ACTIVE: The App has at least one active badge
 *  - APP_STATUS_PENDING: The App has no badges
 *  - APP_STATUS_REVOKED: The App has all the badges revoked
 * @default "APP_STATUS_UNSPECIFIED"
 */
export enum V1Alpha1AppStatus {
  APP_STATUS_UNSPECIFIED = 'APP_STATUS_UNSPECIFIED',
  APP_STATUS_ACTIVE = 'APP_STATUS_ACTIVE',
  APP_STATUS_PENDING = 'APP_STATUS_PENDING',
  APP_STATUS_REVOKED = 'APP_STATUS_REVOKED'
}

/**
 * `Any` contains an arbitrary serialized protocol buffer message along with a
 * URL that describes the type of the serialized message.
 *
 * Protobuf library provides support to pack/unpack Any values in the form
 * of utility functions or additional generated methods of the Any type.
 *
 * Example 1: Pack and unpack a message in C++.
 *
 *     Foo foo = ...;
 *     Any any;
 *     any.PackFrom(foo);
 *     ...
 *     if (any.UnpackTo(&foo)) {
 *       ...
 *     }
 *
 * Example 2: Pack and unpack a message in Java.
 *
 *     Foo foo = ...;
 *     Any any = Any.pack(foo);
 *     ...
 *     if (any.is(Foo.class)) {
 *       foo = any.unpack(Foo.class);
 *     }
 *     // or ...
 *     if (any.isSameTypeAs(Foo.getDefaultInstance())) {
 *       foo = any.unpack(Foo.getDefaultInstance());
 *     }
 *
 *  Example 3: Pack and unpack a message in Python.
 *
 *     foo = Foo(...)
 *     any = Any()
 *     any.Pack(foo)
 *     ...
 *     if any.Is(Foo.DESCRIPTOR):
 *       any.Unpack(foo)
 *       ...
 *
 *  Example 4: Pack and unpack a message in Go
 *
 *      foo := &pb.Foo{...}
 *      any, err := anypb.New(foo)
 *      if err != nil {
 *        ...
 *      }
 *      ...
 *      foo := &pb.Foo{}
 *      if err := any.UnmarshalTo(foo); err != nil {
 *        ...
 *      }
 *
 * The pack methods provided by protobuf library will by default use
 * 'type.googleapis.com/full.type.name' as the type URL and the unpack
 * methods only use the fully qualified type name after the last '/'
 * in the type URL, for example "foo.bar.com/x/y.z" will yield type
 * name "y.z".
 *
 * JSON
 * ====
 * The JSON representation of an `Any` value uses the regular
 * representation of the deserialized, embedded message, with an
 * additional field `@type` which contains the type URL. Example:
 *
 *     package google.profile;
 *     message Person {
 *       string first_name = 1;
 *       string last_name = 2;
 *     }
 *
 *     {
 *       "@type": "type.googleapis.com/google.profile.Person",
 *       "firstName": <string>,
 *       "lastName": <string>
 *     }
 *
 * If the embedded message type is well-known and has a custom JSON
 * representation, that representation will be embedded adding a field
 * `value` which holds the custom JSON in addition to the `@type`
 * field. Example (for message [google.protobuf.Duration][]):
 *
 *     {
 *       "@type": "type.googleapis.com/google.protobuf.Duration",
 *       "value": "1.212s"
 *     }
 */
export interface GoogleprotobufAny {
  /**
   * A URL/resource name that uniquely identifies the type of the serialized
   * protocol buffer message. This string must contain at least
   * one "/" character. The last segment of the URL's path must represent
   * the fully qualified name of the type (as in
   * `path/google.protobuf.Duration`). The name should be in a canonical form
   * (e.g., leading "." is not accepted).
   *
   * In practice, teams usually precompile into the binary all types that they
   * expect it to use in the context of Any. However, for URLs which use the
   * scheme `http`, `https`, or no scheme, one can optionally set up a type
   * server that maps type URLs to message definitions as follows:
   *
   * * If no scheme is provided, `https` is assumed.
   * * An HTTP GET on the URL must yield a [google.protobuf.Type][]
   *   value in binary format, or produce an error.
   * * Applications are allowed to cache lookup results based on the
   *   URL, or have them precompiled into a binary to avoid any
   *   lookup. Therefore, binary compatibility needs to be preserved
   *   on changes to types. (Use versioned type names to manage
   *   breaking changes.)
   *
   * Note: this functionality is not currently available in the official
   * protobuf release, and it is not used for type URLs beginning with
   * type.googleapis.com. As of May 2023, there are no widely used type server
   * implementations and no plans to implement one.
   *
   * Schemes other than `http`, `https` (or the empty scheme) might be
   * used with implementation specific semantics.
   */
  '@type'?: string;
  [key: string]: any;
}

export interface RpcStatus {
  /** @format int32 */
  code?: number;
  message?: string;
  details?: GoogleprotobufAny[];
}

/** Identity Service App. */
export interface V1Alpha1App {
  /** A unique identifier for the App. */
  id?: string;
  /** A human-readable name for the App. */
  name: string;
  /** A human-readable description for the App. */
  description?: string;
  /** The type of the App. */
  type: V1Alpha1AppType;
  /** The DID value */
  resolverMetadataId?: string;
  /** The API Key Secret for the App. */
  apiKey?: string;
  /** The status of the App */
  status?: V1Alpha1AppStatus;
  /**
   * CreatedAt records the timestamp of when the App was initially created
   * @format date-time
   */
  createdAt?: string;
}

export interface V1Alpha1AppInfoResponse {
  /** The App information. */
  app?: V1Alpha1App;
}

export interface V1Alpha1ApproveTokenRequest {
  /** The device id used to handle the approval requestion */
  deviceId?: string;
  /** The session id related to the token that needs to be approved */
  sessionId?: string;
  /** The OTP sent to the device related to the request */
  otp?: string;
  /** The action made by the user (true: allow the token, false: deny the token) */
  approve?: boolean;
}

export interface V1Alpha1AuthorizeRequest {
  /** The resolver metadata id for which authorization is requested. */
  resolverMetadataId?: string;
  /** The MCP Server tool name. */
  toolName?: string;
  /**
   * The User context in the form of an id or access token.
   * Mandatory for User Approval Flows.
   */
  userToken?: string;
}

export interface V1Alpha1AuthorizeResponse {
  /**
   * If authorization is successful, return a code to be used for
   * the token endpoint.
   */
  authorizationCode?: string;
}

export interface V1Alpha1ExtAuthzRequest {
  /** The access token to be authorized. */
  accessToken?: string;
  /** The tool name that will be invoked */
  toolName?: string;
}

export interface V1Alpha1TokenRequest {
  /** Pass the code received from the authorization endpoint. */
  authorizationCode?: string;
}

export interface V1Alpha1TokenResponse {
  /** The access token issued to the Agent or MCP Server. */
  accessToken?: string;
}

import type {AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType} from 'axios';
import axios from 'axios';

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, 'data' | 'params' | 'url' | 'responseType'> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, 'data' | 'cancelToken'> {
  securityWorker?: (securityData: SecurityDataType | null) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = 'application/json',
  JsonApi = 'application/vnd.api+json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain'
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>['securityWorker'];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({securityWorker, secure, format, ...axiosConfig}: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || ''
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {})
      }
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === 'object' && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === 'boolean' ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (type === ContentType.FormData && body && body !== null && typeof body === 'object') {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== 'string') {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? {'Content-Type': type} : {})
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path
    });
  };
}

/**
 * @title agntcy/identity/service/v1alpha1/auth_service.proto
 * @version version not set
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  v1Alpha1 = {
    /**
     * No description
     *
     * @tags Auth
     * @name AppInfo
     * @summary Get App Info
     * @request GET:/v1alpha1/auth/app_info
     */
    appInfo: (params: RequestParams = {}) =>
      this.request<V1Alpha1AppInfoResponse, RpcStatus>({
        path: `/v1alpha1/auth/app_info`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name ApproveToken
     * @summary Handle manual approval of external authorization requets
     * @request POST:/v1alpha1/auth/approve_token
     */
    approveToken: (body: V1Alpha1ApproveTokenRequest, params: RequestParams = {}) =>
      this.request<object, RpcStatus>({
        path: `/v1alpha1/auth/approve_token`,
        method: 'POST',
        body: body,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name Authorize
     * @summary Authorize a request from an Agent or MCP Server
     * @request POST:/v1alpha1/auth/authorize
     */
    authorize: (body: V1Alpha1AuthorizeRequest, params: RequestParams = {}) =>
      this.request<V1Alpha1AuthorizeResponse, RpcStatus>({
        path: `/v1alpha1/auth/authorize`,
        method: 'POST',
        body: body,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name ExtAuthz
     * @summary Handle external authorization requests
     * @request POST:/v1alpha1/auth/ext_authz
     */
    extAuthz: (body: V1Alpha1ExtAuthzRequest, params: RequestParams = {}) =>
      this.request<object, RpcStatus>({
        path: `/v1alpha1/auth/ext_authz`,
        method: 'POST',
        body: body,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name RequestToken
     * @summary Request token for an Agent or MCP Server
     * @request POST:/v1alpha1/auth/token
     */
    requestToken: (body: V1Alpha1TokenRequest, params: RequestParams = {}) =>
      this.request<V1Alpha1TokenResponse, RpcStatus>({
        path: `/v1alpha1/auth/token`,
        method: 'POST',
        body: body,
        type: ContentType.Json,
        format: 'json',
        ...params
      })
  };
}
