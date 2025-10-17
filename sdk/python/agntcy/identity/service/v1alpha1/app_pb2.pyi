import datetime

from google.api import field_behavior_pb2 as _field_behavior_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class AppStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    APP_STATUS_UNSPECIFIED: _ClassVar[AppStatus]
    APP_STATUS_ACTIVE: _ClassVar[AppStatus]
    APP_STATUS_PENDING: _ClassVar[AppStatus]
    APP_STATUS_REVOKED: _ClassVar[AppStatus]

class AppType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    APP_TYPE_UNSPECIFIED: _ClassVar[AppType]
    APP_TYPE_AGENT_A2A: _ClassVar[AppType]
    APP_TYPE_AGENT_OASF: _ClassVar[AppType]
    APP_TYPE_MCP_SERVER: _ClassVar[AppType]
APP_STATUS_UNSPECIFIED: AppStatus
APP_STATUS_ACTIVE: AppStatus
APP_STATUS_PENDING: AppStatus
APP_STATUS_REVOKED: AppStatus
APP_TYPE_UNSPECIFIED: AppType
APP_TYPE_AGENT_A2A: AppType
APP_TYPE_AGENT_OASF: AppType
APP_TYPE_MCP_SERVER: AppType

class App(_message.Message):
    __slots__ = ("id", "name", "description", "type", "resolver_metadata_id", "api_key", "status", "created_at")
    ID_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    RESOLVER_METADATA_ID_FIELD_NUMBER: _ClassVar[int]
    API_KEY_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    id: str
    name: str
    description: str
    type: AppType
    resolver_metadata_id: str
    api_key: str
    status: AppStatus
    created_at: _timestamp_pb2.Timestamp
    def __init__(self, id: _Optional[str] = ..., name: _Optional[str] = ..., description: _Optional[str] = ..., type: _Optional[_Union[AppType, str]] = ..., resolver_metadata_id: _Optional[str] = ..., api_key: _Optional[str] = ..., status: _Optional[_Union[AppStatus, str]] = ..., created_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...
