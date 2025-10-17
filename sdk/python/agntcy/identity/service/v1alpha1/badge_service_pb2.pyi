from agntcy.identity.service.v1alpha1 import badge_pb2 as _badge_pb2
from google.api import annotations_pb2 as _annotations_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class IssueBadgeRequest(_message.Message):
    __slots__ = ("app_id", "a2a", "mcp", "oasf")
    APP_ID_FIELD_NUMBER: _ClassVar[int]
    A2A_FIELD_NUMBER: _ClassVar[int]
    MCP_FIELD_NUMBER: _ClassVar[int]
    OASF_FIELD_NUMBER: _ClassVar[int]
    app_id: str
    a2a: IssueA2ABadgeRequest
    mcp: IssueMcpBadgeRequest
    oasf: IssueOASFBadgeRequest
    def __init__(self, app_id: _Optional[str] = ..., a2a: _Optional[_Union[IssueA2ABadgeRequest, _Mapping]] = ..., mcp: _Optional[_Union[IssueMcpBadgeRequest, _Mapping]] = ..., oasf: _Optional[_Union[IssueOASFBadgeRequest, _Mapping]] = ...) -> None: ...

class IssueMcpBadgeRequest(_message.Message):
    __slots__ = ("name", "url", "schema_base64")
    NAME_FIELD_NUMBER: _ClassVar[int]
    URL_FIELD_NUMBER: _ClassVar[int]
    SCHEMA_BASE64_FIELD_NUMBER: _ClassVar[int]
    name: str
    url: str
    schema_base64: str
    def __init__(self, name: _Optional[str] = ..., url: _Optional[str] = ..., schema_base64: _Optional[str] = ...) -> None: ...

class IssueA2ABadgeRequest(_message.Message):
    __slots__ = ("well_known_url", "schema_base64")
    WELL_KNOWN_URL_FIELD_NUMBER: _ClassVar[int]
    SCHEMA_BASE64_FIELD_NUMBER: _ClassVar[int]
    well_known_url: str
    schema_base64: str
    def __init__(self, well_known_url: _Optional[str] = ..., schema_base64: _Optional[str] = ...) -> None: ...

class IssueOASFBadgeRequest(_message.Message):
    __slots__ = ("schema_base64",)
    SCHEMA_BASE64_FIELD_NUMBER: _ClassVar[int]
    schema_base64: str
    def __init__(self, schema_base64: _Optional[str] = ...) -> None: ...

class VerifyBadgeRequest(_message.Message):
    __slots__ = ("badge",)
    BADGE_FIELD_NUMBER: _ClassVar[int]
    badge: str
    def __init__(self, badge: _Optional[str] = ...) -> None: ...
