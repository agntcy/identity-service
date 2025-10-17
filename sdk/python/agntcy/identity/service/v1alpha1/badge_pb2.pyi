import datetime

from google.protobuf import timestamp_pb2 as _timestamp_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class BadgeType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    BADGE_TYPE_UNSPECIFIED: _ClassVar[BadgeType]
    BADGE_TYPE_AGENT_BADGE: _ClassVar[BadgeType]
    BADGE_TYPE_MCP_BADGE: _ClassVar[BadgeType]

class CredentialStatusPurpose(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED: _ClassVar[CredentialStatusPurpose]
    CREDENTIAL_STATUS_PURPOSE_REVOCATION: _ClassVar[CredentialStatusPurpose]
BADGE_TYPE_UNSPECIFIED: BadgeType
BADGE_TYPE_AGENT_BADGE: BadgeType
BADGE_TYPE_MCP_BADGE: BadgeType
CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED: CredentialStatusPurpose
CREDENTIAL_STATUS_PURPOSE_REVOCATION: CredentialStatusPurpose

class Badge(_message.Message):
    __slots__ = ("verifiable_credential", "app_id")
    VERIFIABLE_CREDENTIAL_FIELD_NUMBER: _ClassVar[int]
    APP_ID_FIELD_NUMBER: _ClassVar[int]
    verifiable_credential: VerifiableCredential
    app_id: str
    def __init__(self, verifiable_credential: _Optional[_Union[VerifiableCredential, _Mapping]] = ..., app_id: _Optional[str] = ...) -> None: ...

class BadgeClaims(_message.Message):
    __slots__ = ("id", "badge")
    ID_FIELD_NUMBER: _ClassVar[int]
    BADGE_FIELD_NUMBER: _ClassVar[int]
    id: str
    badge: str
    def __init__(self, id: _Optional[str] = ..., badge: _Optional[str] = ...) -> None: ...

class CredentialSchema(_message.Message):
    __slots__ = ("type", "id")
    TYPE_FIELD_NUMBER: _ClassVar[int]
    ID_FIELD_NUMBER: _ClassVar[int]
    type: str
    id: str
    def __init__(self, type: _Optional[str] = ..., id: _Optional[str] = ...) -> None: ...

class CredentialStatus(_message.Message):
    __slots__ = ("id", "type", "created_at", "purpose")
    ID_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    PURPOSE_FIELD_NUMBER: _ClassVar[int]
    id: str
    type: str
    created_at: _timestamp_pb2.Timestamp
    purpose: CredentialStatusPurpose
    def __init__(self, id: _Optional[str] = ..., type: _Optional[str] = ..., created_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., purpose: _Optional[_Union[CredentialStatusPurpose, str]] = ...) -> None: ...

class ErrorInfo(_message.Message):
    __slots__ = ("reason", "message")
    REASON_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    reason: str
    message: str
    def __init__(self, reason: _Optional[str] = ..., message: _Optional[str] = ...) -> None: ...

class Proof(_message.Message):
    __slots__ = ("type", "proof_purpose", "proof_value")
    TYPE_FIELD_NUMBER: _ClassVar[int]
    PROOF_PURPOSE_FIELD_NUMBER: _ClassVar[int]
    PROOF_VALUE_FIELD_NUMBER: _ClassVar[int]
    type: str
    proof_purpose: str
    proof_value: str
    def __init__(self, type: _Optional[str] = ..., proof_purpose: _Optional[str] = ..., proof_value: _Optional[str] = ...) -> None: ...

class VerifiableCredential(_message.Message):
    __slots__ = ("context", "type", "issuer", "credential_subject", "id", "issuance_date", "expiration_date", "credential_schema", "credential_status", "proof")
    CONTEXT_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    ISSUER_FIELD_NUMBER: _ClassVar[int]
    CREDENTIAL_SUBJECT_FIELD_NUMBER: _ClassVar[int]
    ID_FIELD_NUMBER: _ClassVar[int]
    ISSUANCE_DATE_FIELD_NUMBER: _ClassVar[int]
    EXPIRATION_DATE_FIELD_NUMBER: _ClassVar[int]
    CREDENTIAL_SCHEMA_FIELD_NUMBER: _ClassVar[int]
    CREDENTIAL_STATUS_FIELD_NUMBER: _ClassVar[int]
    PROOF_FIELD_NUMBER: _ClassVar[int]
    context: _containers.RepeatedScalarFieldContainer[str]
    type: _containers.RepeatedScalarFieldContainer[str]
    issuer: str
    credential_subject: BadgeClaims
    id: str
    issuance_date: str
    expiration_date: str
    credential_schema: _containers.RepeatedCompositeFieldContainer[CredentialSchema]
    credential_status: _containers.RepeatedCompositeFieldContainer[CredentialStatus]
    proof: Proof
    def __init__(self, context: _Optional[_Iterable[str]] = ..., type: _Optional[_Iterable[str]] = ..., issuer: _Optional[str] = ..., credential_subject: _Optional[_Union[BadgeClaims, _Mapping]] = ..., id: _Optional[str] = ..., issuance_date: _Optional[str] = ..., expiration_date: _Optional[str] = ..., credential_schema: _Optional[_Iterable[_Union[CredentialSchema, _Mapping]]] = ..., credential_status: _Optional[_Iterable[_Union[CredentialStatus, _Mapping]]] = ..., proof: _Optional[_Union[Proof, _Mapping]] = ...) -> None: ...

class VerificationResult(_message.Message):
    __slots__ = ("status", "document", "media_type", "controller", "controlled_identifier_document", "warnings", "errors")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    DOCUMENT_FIELD_NUMBER: _ClassVar[int]
    MEDIA_TYPE_FIELD_NUMBER: _ClassVar[int]
    CONTROLLER_FIELD_NUMBER: _ClassVar[int]
    CONTROLLED_IDENTIFIER_DOCUMENT_FIELD_NUMBER: _ClassVar[int]
    WARNINGS_FIELD_NUMBER: _ClassVar[int]
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    status: bool
    document: VerifiableCredential
    media_type: str
    controller: str
    controlled_identifier_document: str
    warnings: _containers.RepeatedCompositeFieldContainer[ErrorInfo]
    errors: _containers.RepeatedCompositeFieldContainer[ErrorInfo]
    def __init__(self, status: _Optional[bool] = ..., document: _Optional[_Union[VerifiableCredential, _Mapping]] = ..., media_type: _Optional[str] = ..., controller: _Optional[str] = ..., controlled_identifier_document: _Optional[str] = ..., warnings: _Optional[_Iterable[_Union[ErrorInfo, _Mapping]]] = ..., errors: _Optional[_Iterable[_Union[ErrorInfo, _Mapping]]] = ...) -> None: ...
