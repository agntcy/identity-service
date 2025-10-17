import datetime

from google.api import field_behavior_pb2 as _field_behavior_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class NotificationType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    NOTIFICATION_TYPE_UNSPECIFIED: _ClassVar[NotificationType]
    NOTIFICATION_TYPE_INFO: _ClassVar[NotificationType]
    NOTIFICATION_TYPE_APPROVAL_REQUEST: _ClassVar[NotificationType]
NOTIFICATION_TYPE_UNSPECIFIED: NotificationType
NOTIFICATION_TYPE_INFO: NotificationType
NOTIFICATION_TYPE_APPROVAL_REQUEST: NotificationType

class ApprovalRequestInfo(_message.Message):
    __slots__ = ("caller_app", "callee_app", "tool_name", "otp", "device_id", "session_id", "timeout_in_seconds")
    CALLER_APP_FIELD_NUMBER: _ClassVar[int]
    CALLEE_APP_FIELD_NUMBER: _ClassVar[int]
    TOOL_NAME_FIELD_NUMBER: _ClassVar[int]
    OTP_FIELD_NUMBER: _ClassVar[int]
    DEVICE_ID_FIELD_NUMBER: _ClassVar[int]
    SESSION_ID_FIELD_NUMBER: _ClassVar[int]
    TIMEOUT_IN_SECONDS_FIELD_NUMBER: _ClassVar[int]
    caller_app: str
    callee_app: str
    tool_name: str
    otp: str
    device_id: str
    session_id: str
    timeout_in_seconds: int
    def __init__(self, caller_app: _Optional[str] = ..., callee_app: _Optional[str] = ..., tool_name: _Optional[str] = ..., otp: _Optional[str] = ..., device_id: _Optional[str] = ..., session_id: _Optional[str] = ..., timeout_in_seconds: _Optional[int] = ...) -> None: ...

class Device(_message.Message):
    __slots__ = ("id", "user_id", "subscription_token", "name", "created_at")
    ID_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    SUBSCRIPTION_TOKEN_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    id: str
    user_id: str
    subscription_token: str
    name: str
    created_at: _timestamp_pb2.Timestamp
    def __init__(self, id: _Optional[str] = ..., user_id: _Optional[str] = ..., subscription_token: _Optional[str] = ..., name: _Optional[str] = ..., created_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class Notification(_message.Message):
    __slots__ = ("body", "type", "approval_request_info")
    BODY_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    APPROVAL_REQUEST_INFO_FIELD_NUMBER: _ClassVar[int]
    body: str
    type: NotificationType
    approval_request_info: ApprovalRequestInfo
    def __init__(self, body: _Optional[str] = ..., type: _Optional[_Union[NotificationType, str]] = ..., approval_request_info: _Optional[_Union[ApprovalRequestInfo, _Mapping]] = ...) -> None: ...
