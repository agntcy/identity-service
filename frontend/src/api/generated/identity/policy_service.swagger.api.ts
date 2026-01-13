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

/** @default "RULE_ACTION_UNSPECIFIED" */
export enum V1Alpha1RuleAction {
  RULE_ACTION_UNSPECIFIED = 'RULE_ACTION_UNSPECIFIED',
  RULE_ACTION_ALLOW = 'RULE_ACTION_ALLOW',
  RULE_ACTION_DENY = 'RULE_ACTION_DENY'
}

export interface PolicyServiceCreateRuleBody {
  /** A human-readable name for the Rule. */
  name?: string;
  /** A human-readable description for the Rule. */
  description?: string;
  /** The tasks that this Rule applies to. */
  tasks?: string[];
  /** Need User Approval for this Rule. */
  needsApproval?: boolean;
  /** The action applied for the rule when calling the tasks */
  action?: V1Alpha1RuleAction;
}

export interface PolicyServiceUpdatePolicyBody {
  /** A human-readable name for the Policy. */
  name?: string;
  /** A human-readable description for the Policy. */
  description?: string;
  /** The requester application that this policy applies to. */
  assignedTo?: string;
}

export interface PolicyServiceUpdateRuleBody {
  /** A human-readable name for the Rule. */
  name?: string;
  /** A human-readable description for the Rule. */
  description?: string;
  /** The tasks that this Rule applies to. */
  tasks?: string[];
  /** Need User Approval for this Rule. */
  needsApproval?: boolean;
  /** The action applied for the rule when calling the tasks */
  action?: V1Alpha1RuleAction;
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

export interface V1Alpha1CreatePolicyRequest {
  /** A human-readable name for the Policy. */
  name?: string;
  /** A human-readable description for the Policy. */
  description?: string;
  /** The requester application that this policy applies to. */
  assignedTo?: string;
}

export interface V1Alpha1GetPoliciesCountResponse {
  /**
   * The total count
   * @format int64
   */
  total?: string;
}

export interface V1Alpha1ListPoliciesResponse {
  /** A list of Policies. */
  policies?: V1Alpha1Policy[];
  /** Pagination response. */
  pagination?: V1Alpha1PagedResponse;
}

export interface V1Alpha1ListRulesResponse {
  /** A list of Rules. */
  rules?: V1Alpha1Rule[];
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

/** Identity Service Policy. */
export interface V1Alpha1Policy {
  /** A unique identifier for the Policy. */
  id?: string;
  /** A human-readable name for the Policy. */
  name: string;
  /** A human-readable description for the Policy. */
  description?: string;
  /** The requester application that this Policy applies to. */
  assignedTo: string;
  /** All the rules that apply to this Policy. */
  rules: V1Alpha1Rule[];
  /**
   * CreatedAt records the timestamp of when the Policy was initially created
   * @format date-time
   */
  createdAt?: string;
}

/** Identity Service Policy Rule */
export interface V1Alpha1Rule {
  /** A unique identifier for the Rule. */
  id?: string;
  /** A human-readable name for the Rule. */
  name: string;
  /** A human-readable description for the Rule. */
  description?: string;
  policyId?: string;
  /** The tasks that this Rule applies to. */
  tasks: V1Alpha1Task[];
  /** The action applied for the rule when calling the specified tasks */
  action: V1Alpha1RuleAction;
  /** Need User Approval for this Rule. */
  needsApproval: boolean;
  /**
   * CreatedAt records the timestamp of when the Rule was initially created
   * @format date-time
   */
  createdAt?: string;
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
 * @title agntcy/identity/service/v1alpha1/policy_service.proto
 * @version version not set
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  v1Alpha1 = {
    /**
     * No description
     *
     * @tags Policy
     * @name ListPolicies
     * @summary List Policies
     * @request GET:/v1alpha1/policies
     */
    listPolicies: (
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
        /** A filter used to fetch policies only for the specified Agentic Services */
        appIds?: string[];
        /** A filter used to fetch policies where the rules applies for the specified Agentic Services */
        rulesForAppIds?: string[];
      },
      params: RequestParams = {}
    ) =>
      this.request<V1Alpha1ListPoliciesResponse, RpcStatus>({
        path: `/v1alpha1/policies`,
        method: 'GET',
        query: query,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Policy
     * @name CreatePolicy
     * @summary Create Policy
     * @request POST:/v1alpha1/policies
     */
    createPolicy: (body: V1Alpha1CreatePolicyRequest, params: RequestParams = {}) =>
      this.request<V1Alpha1Policy, RpcStatus>({
        path: `/v1alpha1/policies`,
        method: 'POST',
        body: body,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Policy
     * @name GetPoliciesCount
     * @summary Get policies total count.
     * @request GET:/v1alpha1/policies/all/count
     */
    getPoliciesCount: (params: RequestParams = {}) =>
      this.request<V1Alpha1GetPoliciesCountResponse, RpcStatus>({
        path: `/v1alpha1/policies/all/count`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Policy
     * @name GetPolicy
     * @summary Get Policy by Id
     * @request GET:/v1alpha1/policies/{policyId}
     */
    getPolicy: (policyId: string, params: RequestParams = {}) =>
      this.request<V1Alpha1Policy, RpcStatus>({
        path: `/v1alpha1/policies/${policyId}`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Policy
     * @name DeletePolicy
     * @summary Delete Policy
     * @request DELETE:/v1alpha1/policies/{policyId}
     */
    deletePolicy: (policyId: string, params: RequestParams = {}) =>
      this.request<object, RpcStatus>({
        path: `/v1alpha1/policies/${policyId}`,
        method: 'DELETE',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Policy
     * @name UpdatePolicy
     * @summary Update Policy
     * @request PATCH:/v1alpha1/policies/{policyId}
     */
    updatePolicy: (policyId: string, body: PolicyServiceUpdatePolicyBody, params: RequestParams = {}) =>
      this.request<V1Alpha1Policy, RpcStatus>({
        path: `/v1alpha1/policies/${policyId}`,
        method: 'PATCH',
        body: body,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Policy
     * @name ListRules
     * @summary List Rules
     * @request GET:/v1alpha1/policies/{policyId}/rules
     */
    listRules: (
      policyId: string,
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
      },
      params: RequestParams = {}
    ) =>
      this.request<V1Alpha1ListRulesResponse, RpcStatus>({
        path: `/v1alpha1/policies/${policyId}/rules`,
        method: 'GET',
        query: query,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Policy
     * @name CreateRule
     * @summary Create Rule
     * @request POST:/v1alpha1/policies/{policyId}/rules
     */
    createRule: (policyId: string, body: PolicyServiceCreateRuleBody, params: RequestParams = {}) =>
      this.request<V1Alpha1Rule, RpcStatus>({
        path: `/v1alpha1/policies/${policyId}/rules`,
        method: 'POST',
        body: body,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Policy
     * @name GetRule
     * @summary Get Rule by Id
     * @request GET:/v1alpha1/policies/{policyId}/rules/{ruleId}
     */
    getRule: (policyId: string, ruleId: string, params: RequestParams = {}) =>
      this.request<V1Alpha1Rule, RpcStatus>({
        path: `/v1alpha1/policies/${policyId}/rules/${ruleId}`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Policy
     * @name DeleteRule
     * @summary Delete Rule
     * @request DELETE:/v1alpha1/policies/{policyId}/rules/{ruleId}
     */
    deleteRule: (policyId: string, ruleId: string, params: RequestParams = {}) =>
      this.request<object, RpcStatus>({
        path: `/v1alpha1/policies/${policyId}/rules/${ruleId}`,
        method: 'DELETE',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Policy
     * @name UpdateRule
     * @summary Update Rule
     * @request PATCH:/v1alpha1/policies/{policyId}/rules/{ruleId}
     */
    updateRule: (policyId: string, ruleId: string, body: PolicyServiceUpdateRuleBody, params: RequestParams = {}) =>
      this.request<V1Alpha1Rule, RpcStatus>({
        path: `/v1alpha1/policies/${policyId}/rules/${ruleId}`,
        method: 'PATCH',
        body: body,
        type: ContentType.Json,
        format: 'json',
        ...params
      })
  };
}
