import datetime

from google.api import field_behavior_pb2 as _field_behavior_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class IdpType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    IDP_TYPE_UNSPECIFIED: _ClassVar[IdpType]
    IDP_TYPE_DUO: _ClassVar[IdpType]
    IDP_TYPE_OKTA: _ClassVar[IdpType]
    IDP_TYPE_ORY: _ClassVar[IdpType]
    IDP_TYPE_SELF: _ClassVar[IdpType]
    IDP_TYPE_KEYCLOAK: _ClassVar[IdpType]
IDP_TYPE_UNSPECIFIED: IdpType
IDP_TYPE_DUO: IdpType
IDP_TYPE_OKTA: IdpType
IDP_TYPE_ORY: IdpType
IDP_TYPE_SELF: IdpType
IDP_TYPE_KEYCLOAK: IdpType

class ApiKey(_message.Message):
    __slots__ = ("api_key",)
    API_KEY_FIELD_NUMBER: _ClassVar[int]
    api_key: str
    def __init__(self, api_key: _Optional[str] = ...) -> None: ...

class DuoIdpSettings(_message.Message):
    __slots__ = ("hostname", "integration_key", "secret_key")
    HOSTNAME_FIELD_NUMBER: _ClassVar[int]
    INTEGRATION_KEY_FIELD_NUMBER: _ClassVar[int]
    SECRET_KEY_FIELD_NUMBER: _ClassVar[int]
    hostname: str
    integration_key: str
    secret_key: str
    def __init__(self, hostname: _Optional[str] = ..., integration_key: _Optional[str] = ..., secret_key: _Optional[str] = ...) -> None: ...

class IssuerSettings(_message.Message):
    __slots__ = ("issuer_id", "idp_type", "duo_idp_settings", "okta_idp_settings", "ory_idp_settings", "keycloak_idp_settings", "created_at", "updated_at")
    ISSUER_ID_FIELD_NUMBER: _ClassVar[int]
    IDP_TYPE_FIELD_NUMBER: _ClassVar[int]
    DUO_IDP_SETTINGS_FIELD_NUMBER: _ClassVar[int]
    OKTA_IDP_SETTINGS_FIELD_NUMBER: _ClassVar[int]
    ORY_IDP_SETTINGS_FIELD_NUMBER: _ClassVar[int]
    KEYCLOAK_IDP_SETTINGS_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_FIELD_NUMBER: _ClassVar[int]
    issuer_id: str
    idp_type: IdpType
    duo_idp_settings: DuoIdpSettings
    okta_idp_settings: OktaIdpSettings
    ory_idp_settings: OryIdpSettings
    keycloak_idp_settings: KeycloakIdpSettings
    created_at: _timestamp_pb2.Timestamp
    updated_at: _timestamp_pb2.Timestamp
    def __init__(self, issuer_id: _Optional[str] = ..., idp_type: _Optional[_Union[IdpType, str]] = ..., duo_idp_settings: _Optional[_Union[DuoIdpSettings, _Mapping]] = ..., okta_idp_settings: _Optional[_Union[OktaIdpSettings, _Mapping]] = ..., ory_idp_settings: _Optional[_Union[OryIdpSettings, _Mapping]] = ..., keycloak_idp_settings: _Optional[_Union[KeycloakIdpSettings, _Mapping]] = ..., created_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., updated_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class KeycloakIdpSettings(_message.Message):
    __slots__ = ("base_url", "realm", "client_id", "client_secret")
    BASE_URL_FIELD_NUMBER: _ClassVar[int]
    REALM_FIELD_NUMBER: _ClassVar[int]
    CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
    CLIENT_SECRET_FIELD_NUMBER: _ClassVar[int]
    base_url: str
    realm: str
    client_id: str
    client_secret: str
    def __init__(self, base_url: _Optional[str] = ..., realm: _Optional[str] = ..., client_id: _Optional[str] = ..., client_secret: _Optional[str] = ...) -> None: ...

class OktaIdpSettings(_message.Message):
    __slots__ = ("org_url", "client_id", "private_key")
    ORG_URL_FIELD_NUMBER: _ClassVar[int]
    CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
    PRIVATE_KEY_FIELD_NUMBER: _ClassVar[int]
    org_url: str
    client_id: str
    private_key: str
    def __init__(self, org_url: _Optional[str] = ..., client_id: _Optional[str] = ..., private_key: _Optional[str] = ...) -> None: ...

class OryIdpSettings(_message.Message):
    __slots__ = ("project_slug", "api_key")
    PROJECT_SLUG_FIELD_NUMBER: _ClassVar[int]
    API_KEY_FIELD_NUMBER: _ClassVar[int]
    project_slug: str
    api_key: str
    def __init__(self, project_slug: _Optional[str] = ..., api_key: _Optional[str] = ...) -> None: ...

class Settings(_message.Message):
    __slots__ = ("api_key", "issuer_settings")
    API_KEY_FIELD_NUMBER: _ClassVar[int]
    ISSUER_SETTINGS_FIELD_NUMBER: _ClassVar[int]
    api_key: ApiKey
    issuer_settings: IssuerSettings
    def __init__(self, api_key: _Optional[_Union[ApiKey, _Mapping]] = ..., issuer_settings: _Optional[_Union[IssuerSettings, _Mapping]] = ...) -> None: ...
