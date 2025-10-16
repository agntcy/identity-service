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
 * Type
 * - IDP_TYPE_UNSPECIFIED: Unspecified Envelope Type.
 *  - IDP_TYPE_DUO: Idp Type Duo.
 *  - IDP_TYPE_OKTA: Idp Type Okta.
 *  - IDP_TYPE_ORY: Idp Type Ory.
 *  - IDP_TYPE_SELF: Idp Type Self.
 *  - IDP_TYPE_KEYCLOAK: Idp Type Keycloak.
 * @default "IDP_TYPE_UNSPECIFIED"
 */
export enum V1Alpha1IdpType {
  IDP_TYPE_UNSPECIFIED = 'IDP_TYPE_UNSPECIFIED',
  IDP_TYPE_DUO = 'IDP_TYPE_DUO',
  IDP_TYPE_OKTA = 'IDP_TYPE_OKTA',
  IDP_TYPE_ORY = 'IDP_TYPE_ORY',
  IDP_TYPE_SELF = 'IDP_TYPE_SELF',
  IDP_TYPE_KEYCLOAK = 'IDP_TYPE_KEYCLOAK'
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

/** An Identity API Key. */
export interface V1Alpha1ApiKey {
  apiKey?: string;
}

/** Duo IdP Settings */
export interface V1Alpha1DuoIdpSettings {
  hostname?: string;
  integrationKey?: string;
  secretKey?: string;
}

/** Issuer Settings */
export interface V1Alpha1IssuerSettings {
  /**
   * A unique identifier for the Issuer.
   * This is typically the Issuer's ID in the Identity.
   */
  issuerId?: string;
  /** The type of the IdP. */
  idpType: V1Alpha1IdpType;
  /** Settings for the Duo Identity Provider. */
  duoIdpSettings?: V1Alpha1DuoIdpSettings;
  /** Settings for the Okta Identity Provider. */
  oktaIdpSettings?: V1Alpha1OktaIdpSettings;
  /** Settings for the Ory Identity Provider. */
  oryIdpSettings?: V1Alpha1OryIdpSettings;
  /** Settings for the Keycloak Identity Provider. */
  keycloakIdpSettings?: V1Alpha1KeycloakIdpSettings;
}

/** Keycloak IdP Settings */
export interface V1Alpha1KeycloakIdpSettings {
  baseUrl?: string;
  realm?: string;
  clientId?: string;
  clientSecret?: string;
}

/** Okta IdP Settings */
export interface V1Alpha1OktaIdpSettings {
  orgUrl?: string;
  clientId?: string;
  privateKey?: string;
}

/** Ory IdP Settings */
export interface V1Alpha1OryIdpSettings {
  projectSlug?: string;
  apiKey?: string;
}

export interface V1Alpha1SetIssuerRequest {
  /** The Issuer Settings to set up. */
  issuerSettings: V1Alpha1IssuerSettings;
}

/** Identity Settings */
export interface V1Alpha1Settings {
  /** An API Key for the Identity Service. */
  apiKey?: V1Alpha1ApiKey;
  /** Settings for the Issuer. */
  issuerSettings?: V1Alpha1IssuerSettings;
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
 * @title agntcy/identity/service/v1alpha1/settings_service.proto
 * @version version not set
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  v1Alpha1 = {
    /**
     * No description
     *
     * @tags Settings
     * @name GetSettings
     * @summary Get Settings for the Tenant
     * @request GET:/v1alpha1/settings
     */
    getSettings: (params: RequestParams = {}) =>
      this.request<V1Alpha1Settings, RpcStatus>({
        path: `/v1alpha1/settings`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * @description Create a new API Key for the Tenant. Revoke any previous API Key
     *
     * @tags Settings
     * @name SettingsServiceSetApiKey
     * @summary Set up API Key
     * @request POST:/v1alpha1/settings/api-key
     */
    settingsServiceSetApiKey: (params: RequestParams = {}) =>
      this.request<V1Alpha1ApiKey, RpcStatus>({
        path: `/v1alpha1/settings/api-key`,
        method: 'POST',
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Settings
     * @name SetUpIssuer
     * @summary Create and register Issuer for the Tenant. Revoke any previous Issuer.
     * @request POST:/v1alpha1/settings/issuer
     */
    setUpIssuer: (body: V1Alpha1SetIssuerRequest, params: RequestParams = {}) =>
      this.request<V1Alpha1IssuerSettings, RpcStatus>({
        path: `/v1alpha1/settings/issuer`,
        method: 'POST',
        body: body,
        type: ContentType.Json,
        format: 'json',
        ...params
      })
  };
}
