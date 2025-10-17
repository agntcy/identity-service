from agntcy.identity.service.v1alpha1 import settings_pb2 as _settings_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.api import field_behavior_pb2 as _field_behavior_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class GetSettingsRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class SetApiKeyRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class SetIssuerRequest(_message.Message):
    __slots__ = ("issuer_settings",)
    ISSUER_SETTINGS_FIELD_NUMBER: _ClassVar[int]
    issuer_settings: _settings_pb2.IssuerSettings
    def __init__(self, issuer_settings: _Optional[_Union[_settings_pb2.IssuerSettings, _Mapping]] = ...) -> None: ...
