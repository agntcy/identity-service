from agntcy.identity.service.v1alpha1 import pagination_pb2 as _pagination_pb2
from agntcy.identity.service.v1alpha1 import policy_pb2 as _policy_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ListPoliciesResponse(_message.Message):
    __slots__ = ("policies", "pagination")
    POLICIES_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    policies: _containers.RepeatedCompositeFieldContainer[_policy_pb2.Policy]
    pagination: _pagination_pb2.PagedResponse
    def __init__(self, policies: _Optional[_Iterable[_Union[_policy_pb2.Policy, _Mapping]]] = ..., pagination: _Optional[_Union[_pagination_pb2.PagedResponse, _Mapping]] = ...) -> None: ...

class ListPoliciesRequest(_message.Message):
    __slots__ = ("page", "size", "query", "app_ids", "rules_for_app_ids")
    PAGE_FIELD_NUMBER: _ClassVar[int]
    SIZE_FIELD_NUMBER: _ClassVar[int]
    QUERY_FIELD_NUMBER: _ClassVar[int]
    APP_IDS_FIELD_NUMBER: _ClassVar[int]
    RULES_FOR_APP_IDS_FIELD_NUMBER: _ClassVar[int]
    page: int
    size: int
    query: str
    app_ids: _containers.RepeatedScalarFieldContainer[str]
    rules_for_app_ids: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, page: _Optional[int] = ..., size: _Optional[int] = ..., query: _Optional[str] = ..., app_ids: _Optional[_Iterable[str]] = ..., rules_for_app_ids: _Optional[_Iterable[str]] = ...) -> None: ...

class GetPoliciesCountRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class GetPoliciesCountResponse(_message.Message):
    __slots__ = ("total",)
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    total: int
    def __init__(self, total: _Optional[int] = ...) -> None: ...

class CreatePolicyRequest(_message.Message):
    __slots__ = ("name", "description", "assigned_to")
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    ASSIGNED_TO_FIELD_NUMBER: _ClassVar[int]
    name: str
    description: str
    assigned_to: str
    def __init__(self, name: _Optional[str] = ..., description: _Optional[str] = ..., assigned_to: _Optional[str] = ...) -> None: ...

class GetPolicyRequest(_message.Message):
    __slots__ = ("policy_id",)
    POLICY_ID_FIELD_NUMBER: _ClassVar[int]
    policy_id: str
    def __init__(self, policy_id: _Optional[str] = ...) -> None: ...

class UpdatePolicyRequest(_message.Message):
    __slots__ = ("policy_id", "name", "description", "assigned_to")
    POLICY_ID_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    ASSIGNED_TO_FIELD_NUMBER: _ClassVar[int]
    policy_id: str
    name: str
    description: str
    assigned_to: str
    def __init__(self, policy_id: _Optional[str] = ..., name: _Optional[str] = ..., description: _Optional[str] = ..., assigned_to: _Optional[str] = ...) -> None: ...

class DeletePolicyRequest(_message.Message):
    __slots__ = ("policy_id",)
    POLICY_ID_FIELD_NUMBER: _ClassVar[int]
    policy_id: str
    def __init__(self, policy_id: _Optional[str] = ...) -> None: ...

class ListRulesResponse(_message.Message):
    __slots__ = ("rules", "pagination")
    RULES_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    rules: _containers.RepeatedCompositeFieldContainer[_policy_pb2.Rule]
    pagination: _pagination_pb2.PagedResponse
    def __init__(self, rules: _Optional[_Iterable[_Union[_policy_pb2.Rule, _Mapping]]] = ..., pagination: _Optional[_Union[_pagination_pb2.PagedResponse, _Mapping]] = ...) -> None: ...

class ListRulesRequest(_message.Message):
    __slots__ = ("policy_id", "page", "size", "query")
    POLICY_ID_FIELD_NUMBER: _ClassVar[int]
    PAGE_FIELD_NUMBER: _ClassVar[int]
    SIZE_FIELD_NUMBER: _ClassVar[int]
    QUERY_FIELD_NUMBER: _ClassVar[int]
    policy_id: str
    page: int
    size: int
    query: str
    def __init__(self, policy_id: _Optional[str] = ..., page: _Optional[int] = ..., size: _Optional[int] = ..., query: _Optional[str] = ...) -> None: ...

class CreateRuleRequest(_message.Message):
    __slots__ = ("policy_id", "name", "description", "tasks", "needs_approval", "action")
    POLICY_ID_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    TASKS_FIELD_NUMBER: _ClassVar[int]
    NEEDS_APPROVAL_FIELD_NUMBER: _ClassVar[int]
    ACTION_FIELD_NUMBER: _ClassVar[int]
    policy_id: str
    name: str
    description: str
    tasks: _containers.RepeatedScalarFieldContainer[str]
    needs_approval: bool
    action: _policy_pb2.RuleAction
    def __init__(self, policy_id: _Optional[str] = ..., name: _Optional[str] = ..., description: _Optional[str] = ..., tasks: _Optional[_Iterable[str]] = ..., needs_approval: _Optional[bool] = ..., action: _Optional[_Union[_policy_pb2.RuleAction, str]] = ...) -> None: ...

class GetRuleRequest(_message.Message):
    __slots__ = ("policy_id", "rule_id")
    POLICY_ID_FIELD_NUMBER: _ClassVar[int]
    RULE_ID_FIELD_NUMBER: _ClassVar[int]
    policy_id: str
    rule_id: str
    def __init__(self, policy_id: _Optional[str] = ..., rule_id: _Optional[str] = ...) -> None: ...

class UpdateRuleRequest(_message.Message):
    __slots__ = ("policy_id", "rule_id", "name", "description", "tasks", "needs_approval", "action")
    POLICY_ID_FIELD_NUMBER: _ClassVar[int]
    RULE_ID_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    TASKS_FIELD_NUMBER: _ClassVar[int]
    NEEDS_APPROVAL_FIELD_NUMBER: _ClassVar[int]
    ACTION_FIELD_NUMBER: _ClassVar[int]
    policy_id: str
    rule_id: str
    name: str
    description: str
    tasks: _containers.RepeatedScalarFieldContainer[str]
    needs_approval: bool
    action: _policy_pb2.RuleAction
    def __init__(self, policy_id: _Optional[str] = ..., rule_id: _Optional[str] = ..., name: _Optional[str] = ..., description: _Optional[str] = ..., tasks: _Optional[_Iterable[str]] = ..., needs_approval: _Optional[bool] = ..., action: _Optional[_Union[_policy_pb2.RuleAction, str]] = ...) -> None: ...

class DeleteRuleRequest(_message.Message):
    __slots__ = ("policy_id", "rule_id")
    POLICY_ID_FIELD_NUMBER: _ClassVar[int]
    RULE_ID_FIELD_NUMBER: _ClassVar[int]
    policy_id: str
    rule_id: str
    def __init__(self, policy_id: _Optional[str] = ..., rule_id: _Optional[str] = ...) -> None: ...
