/**
 * Copyright 2026 Copyright AGNTCY Contributors (https://github.com/agntcy)
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
 * The purpose of the status entry
 * - CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED: Unspecified status purpose
 *  - CREDENTIAL_STATUS_PURPOSE_REVOCATION: Used to cancel the validity of a verifiable credential.
 * This status is not reversible.
 * @default "CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED"
 */
export enum V1Alpha1CredentialStatusPurpose {
  CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED = 'CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED',
  CREDENTIAL_STATUS_PURPOSE_REVOCATION = 'CREDENTIAL_STATUS_PURPOSE_REVOCATION'
}

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

export interface GetTasksResponseTaskList {
  tasks?: V1Alpha1Task[];
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

export interface V1Alpha1AppTypeCountEntry {
  /**
   * The type of the App
   * - APP_TYPE_UNSPECIFIED: Unspecified Envelope Type.
   *  - APP_TYPE_AGENT_A2A: Agent A2A App Type.
   *  - APP_TYPE_AGENT_OASF: Agent OASF App Type.
   *  - APP_TYPE_MCP_SERVER: Agent MCP Server App Type.
   */
  key?: V1Alpha1AppType;
  /**
   * The count of apps of the given type
   * @format int64
   */
  value?: string;
}

export interface V1Alpha1Badge {
  /** [here]: https://www.w3.org/TR/vc-data-model/ */
  verifiableCredential?: V1Alpha1VerifiableCredential;
  appId?: string;
}

/**
 * BadgeClaims represents the content of a Badge VC defined [here]
 * [here]: https://spec.identity.agntcy.org/docs/vc/intro/
 */
export interface V1Alpha1BadgeClaims {
  /**
   * The ID as defined [here]
   * [here]: https://www.w3.org/TR/vc-data-model/#credential-subject
   */
  id?: string;
  /** The content of the badge */
  badge?: string;
}

export interface V1Alpha1CreateOasfAppRequest {
  /** The OASF schema in a base64 encoded format */
  schemaBase64?: string;
}

export interface V1Alpha1CreateOasfAppResponse {
  /** The created OASF App. */
  app?: V1Alpha1App;
  /** The issued badge for the OASF App. */
  badge?: V1Alpha1Badge;
}

/**
 * CredentialSchema represents the credentialSchema property of a Verifiable Credential.
 * more information can be found [here]
 * [here]: https://www.w3.org/TR/vc-data-model-2.0/#data-schemas
 */
export interface V1Alpha1CredentialSchema {
  /** Type specifies the type of the file */
  type?: string;
  /** The URL identifying the schema file */
  id?: string;
}

/**
 * CredentialStatus represents the credentialStatus property of a Verifiable Credential.
 * more information can be found [here]
 * [here]: https://www.w3.org/TR/vc-data-model-2.0/#status
 */
export interface V1Alpha1CredentialStatus {
  /** The URL identifying the schema file */
  id?: string;
  /** Type specifies the type of the file */
  type?: string;
  /**
   * The creation date and time of the status
   * @format date-time
   */
  createdAt?: string;
  /**
   * The value of the purpose for the status entry
   * - CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED: Unspecified status purpose
   *  - CREDENTIAL_STATUS_PURPOSE_REVOCATION: Used to cancel the validity of a verifiable credential.
   * This status is not reversible.
   */
  purpose?: V1Alpha1CredentialStatusPurpose;
}

export interface V1Alpha1GetAppsCountResponse {
  /** The apps count per app type */
  counts?: V1Alpha1AppTypeCountEntry[];
  /**
   * The total count
   * @format int64
   */
  total?: string;
}

export interface V1Alpha1GetTasksResponse {
  /** The list of tasks per Agentic Service type */
  result?: Record<string, GetTasksResponseTaskList>;
}

export interface V1Alpha1ListAppsResponse {
  /** A list of Apps. */
  apps?: V1Alpha1App[];
  /** Pagination response. */
  pagination?: V1Alpha1PagedResponse;
}

/** Pagination response */
export interface V1Alpha1PagedResponse {
  /**
   * Next page
   * @format int32
   */
  nextPage?: number;
  /** Has next page */
  hasNextPage?: boolean;
  /**
   * The total size of items
   * @format int64
   */
  total?: string;
  /**
   * The size of the current page
   * @format int32
   */
  size?: number;
}

/**
 * A data integrity proof provides information about the proof mechanism,
 * parameters required to verify that proof, and the proof value itself.
 */
export interface V1Alpha1Proof {
  /** The type of the proof */
  type?: string;
  /** The proof purpose */
  proofPurpose?: string;
  /** The proof value */
  proofValue?: string;
}

/** Identity Service Policy Task */
export interface V1Alpha1Task {
  /** A unique identifier for the Task. */
  id?: string;
  /** A human-readable name for the Task. */
  name?: string;
  /** A human-readable description for the Task. */
  description?: string;
  /** An application ID for the Task. */
  appId?: string;
  /** A tool name for the Task. */
  toolName?: string;
}

/**
 * DataModel represents the W3C Verifiable Credential Data Model defined [here]
 * [here]: https://www.w3.org/TR/vc-data-model/
 */
export interface V1Alpha1VerifiableCredential {
  /** https://www.w3.org/TR/vc-data-model/#contexts */
  context?: string[];
  /** https://www.w3.org/TR/vc-data-model/#dfn-type */
  type?: string[];
  /** https://www.w3.org/TR/vc-data-model/#issuer */
  issuer?: string;
  /**
   * https://www.w3.org/TR/vc-data-model/#credential-subject
   * [here]: https://spec.identity.agntcy.org/docs/vc/intro/
   */
  credentialSubject?: V1Alpha1BadgeClaims;
  /** https://www.w3.org/TR/vc-data-model/#identifiers */
  id?: string;
  /** https://www.w3.org/TR/vc-data-model/#issuance-date */
  issuanceDate?: string;
  /** https://www.w3.org/TR/vc-data-model/#expiration */
  expirationDate?: string;
  /** https://www.w3.org/TR/vc-data-model-2.0/#data-schemas */
  credentialSchema?: V1Alpha1CredentialSchema[];
  /** https://www.w3.org/TR/vc-data-model-2.0/#status */
  credentialStatus?: V1Alpha1CredentialStatus[];
  /**
   * https://w3id.org/security#proof
   * A data integrity proof provides information about the proof mechanism,
   * parameters required to verify that proof, and the proof value itself.
   */
  proof?: V1Alpha1Proof;
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
 * @title agntcy/identity/service/v1alpha1/app_service.proto
 * @version version not set
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  v1Alpha1 = {
    /**
     * No description
     *
     * @tags App
     * @name ListApps
     * @summary List Apps
     * @request GET:/v1alpha1/apps
     */
    listApps: (
      query?: {
        /**
         * The current page of the pagination
         * @format int32
         */
        page?: number;
        /**
         * The page size of the pagination
         * @format int32
         */
        size?: number;
        /** The search query */
        query?: string;
        /**
         * The app type filter
         *
         *  - APP_TYPE_UNSPECIFIED: Unspecified Envelope Type.
         *  - APP_TYPE_AGENT_A2A: Agent A2A App Type.
         *  - APP_TYPE_AGENT_OASF: Agent OASF App Type.
         *  - APP_TYPE_MCP_SERVER: Agent MCP Server App Type.
         */
        types?: ('APP_TYPE_UNSPECIFIED' | 'APP_TYPE_AGENT_A2A' | 'APP_TYPE_AGENT_OASF' | 'APP_TYPE_MCP_SERVER')[];
        /** The column ID to sort by */
        sortColumn?: string;
        /** Whether to sort in descending order (true) or ascending order (false) */
        sortDesc?: boolean;
      },
      params: RequestParams = {}
    ) =>
      this.request<V1Alpha1ListAppsResponse, RpcStatus>({
        path: `/v1alpha1/apps`,
        method: 'GET',
        query: query,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags App
     * @name CreateApp
     * @summary Create App
     * @request POST:/v1alpha1/apps
     */
    createApp: (app: V1Alpha1App, params: RequestParams = {}) =>
      this.request<V1Alpha1App, RpcStatus>({
        path: `/v1alpha1/apps`,
        method: 'POST',
        body: app,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags App
     * @name GetAppsCount
     * @summary Get apps count per type
     * @request GET:/v1alpha1/apps/all/count
     */
    getAppsCount: (params: RequestParams = {}) =>
      this.request<V1Alpha1GetAppsCountResponse, RpcStatus>({
        path: `/v1alpha1/apps/all/count`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags App
     * @name CreateOasfApp
     * @summary Create an OASF App from an OASF schema and issue a badge
     * @request POST:/v1alpha1/apps/oasf
     */
    createOasfApp: (body: V1Alpha1CreateOasfAppRequest, params: RequestParams = {}) =>
      this.request<V1Alpha1CreateOasfAppResponse, RpcStatus>({
        path: `/v1alpha1/apps/oasf`,
        method: 'POST',
        body: body,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags App
     * @name GetApp
     * @summary Get App by Id
     * @request GET:/v1alpha1/apps/{appId}
     */
    getApp: (appId: string, params: RequestParams = {}) =>
      this.request<V1Alpha1App, RpcStatus>({
        path: `/v1alpha1/apps/${appId}`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags App
     * @name DeleteApp
     * @summary Delete App
     * @request DELETE:/v1alpha1/apps/{appId}
     */
    deleteApp: (appId: string, params: RequestParams = {}) =>
      this.request<object, RpcStatus>({
        path: `/v1alpha1/apps/${appId}`,
        method: 'DELETE',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags App
     * @name UpdateApp
     * @summary Update App
     * @request PATCH:/v1alpha1/apps/{appId}
     */
    updateApp: (appId: string, app: V1Alpha1App, params: RequestParams = {}) =>
      this.request<V1Alpha1App, RpcStatus>({
        path: `/v1alpha1/apps/${appId}`,
        method: 'PATCH',
        body: app,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags App
     * @name RefreshAppApiKey
     * @summary Refresh the API Key for an App
     * @request GET:/v1alpha1/apps/{appId}/api-key/refresh
     */
    refreshAppApiKey: (appId: string, params: RequestParams = {}) =>
      this.request<V1Alpha1App, RpcStatus>({
        path: `/v1alpha1/apps/${appId}/api-key/refresh`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags App
     * @name GetAppBadge
     * @summary Get the current badge issued for the App using the App ID or the Resolver Metadata ID.
     * @request GET:/v1alpha1/apps/{appId}/badge
     */
    getAppBadge: (appId: string, params: RequestParams = {}) =>
      this.request<V1Alpha1Badge, RpcStatus>({
        path: `/v1alpha1/apps/${appId}/badge`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags App
     * @name GetTasks
     * @summary Get the list of tasks of all apps
     * @request GET:/v1alpha1/tasks
     */
    getTasks: (
      query?: {
        /** A filter to exclude fetching tasks for the specified app ids */
        excludeAppIds?: string[];
      },
      params: RequestParams = {}
    ) =>
      this.request<V1Alpha1GetTasksResponse, RpcStatus>({
        path: `/v1alpha1/tasks`,
        method: 'GET',
        query: query,
        format: 'json',
        ...params
      })
  };
}
