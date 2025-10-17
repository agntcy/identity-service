from agntcy.identity.service.v1alpha1 import app_pb2 as _app_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class AppInfoResponse(_message.Message):
    __slots__ = ("app",)
    APP_FIELD_NUMBER: _ClassVar[int]
    app: _app_pb2.App
    def __init__(self, app: _Optional[_Union[_app_pb2.App, _Mapping]] = ...) -> None: ...

class AuthorizeRequest(_message.Message):
    __slots__ = ("resolver_metadata_id", "tool_name", "user_token")
    RESOLVER_METADATA_ID_FIELD_NUMBER: _ClassVar[int]
    TOOL_NAME_FIELD_NUMBER: _ClassVar[int]
    USER_TOKEN_FIELD_NUMBER: _ClassVar[int]
    resolver_metadata_id: str
    tool_name: str
    user_token: str
    def __init__(self, resolver_metadata_id: _Optional[str] = ..., tool_name: _Optional[str] = ..., user_token: _Optional[str] = ...) -> None: ...

class AuthorizeResponse(_message.Message):
    __slots__ = ("authorization_code",)
    AUTHORIZATION_CODE_FIELD_NUMBER: _ClassVar[int]
    authorization_code: str
    def __init__(self, authorization_code: _Optional[str] = ...) -> None: ...

class TokenRequest(_message.Message):
    __slots__ = ("authorization_code",)
    AUTHORIZATION_CODE_FIELD_NUMBER: _ClassVar[int]
    authorization_code: str
    def __init__(self, authorization_code: _Optional[str] = ...) -> None: ...

class TokenResponse(_message.Message):
    __slots__ = ("access_token",)
    ACCESS_TOKEN_FIELD_NUMBER: _ClassVar[int]
    access_token: str
    def __init__(self, access_token: _Optional[str] = ...) -> None: ...

class ExtAuthzRequest(_message.Message):
    __slots__ = ("access_token", "tool_name")
    ACCESS_TOKEN_FIELD_NUMBER: _ClassVar[int]
    TOOL_NAME_FIELD_NUMBER: _ClassVar[int]
    access_token: str
    tool_name: str
    def __init__(self, access_token: _Optional[str] = ..., tool_name: _Optional[str] = ...) -> None: ...

class ApproveTokenRequest(_message.Message):
    __slots__ = ("device_id", "session_id", "otp", "approve")
    DEVICE_ID_FIELD_NUMBER: _ClassVar[int]
    SESSION_ID_FIELD_NUMBER: _ClassVar[int]
    OTP_FIELD_NUMBER: _ClassVar[int]
    APPROVE_FIELD_NUMBER: _ClassVar[int]
    device_id: str
    session_id: str
    otp: str
    approve: bool
    def __init__(self, device_id: _Optional[str] = ..., session_id: _Optional[str] = ..., otp: _Optional[str] = ..., approve: _Optional[bool] = ...) -> None: ...
