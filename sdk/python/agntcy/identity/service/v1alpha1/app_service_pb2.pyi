from agntcy.identity.service.v1alpha1 import app_pb2 as _app_pb2
from agntcy.identity.service.v1alpha1 import badge_pb2 as _badge_pb2
from agntcy.identity.service.v1alpha1 import pagination_pb2 as _pagination_pb2
from agntcy.identity.service.v1alpha1 import policy_pb2 as _policy_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.api import client_pb2 as _client_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ListAppsResponse(_message.Message):
    __slots__ = ("apps", "pagination")
    APPS_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    apps: _containers.RepeatedCompositeFieldContainer[_app_pb2.App]
    pagination: _pagination_pb2.PagedResponse
    def __init__(self, apps: _Optional[_Iterable[_Union[_app_pb2.App, _Mapping]]] = ..., pagination: _Optional[_Union[_pagination_pb2.PagedResponse, _Mapping]] = ...) -> None: ...

class ListAppsRequest(_message.Message):
    __slots__ = ("page", "size", "query", "types", "sort_column", "sort_desc")
    PAGE_FIELD_NUMBER: _ClassVar[int]
    SIZE_FIELD_NUMBER: _ClassVar[int]
    QUERY_FIELD_NUMBER: _ClassVar[int]
    TYPES_FIELD_NUMBER: _ClassVar[int]
    SORT_COLUMN_FIELD_NUMBER: _ClassVar[int]
    SORT_DESC_FIELD_NUMBER: _ClassVar[int]
    page: int
    size: int
    query: str
    types: _containers.RepeatedScalarFieldContainer[_app_pb2.AppType]
    sort_column: str
    sort_desc: bool
    def __init__(self, page: _Optional[int] = ..., size: _Optional[int] = ..., query: _Optional[str] = ..., types: _Optional[_Iterable[_Union[_app_pb2.AppType, str]]] = ..., sort_column: _Optional[str] = ..., sort_desc: _Optional[bool] = ...) -> None: ...

class CreateAppRequest(_message.Message):
    __slots__ = ("app",)
    APP_FIELD_NUMBER: _ClassVar[int]
    app: _app_pb2.App
    def __init__(self, app: _Optional[_Union[_app_pb2.App, _Mapping]] = ...) -> None: ...

class CreateOasfAppRequest(_message.Message):
    __slots__ = ("schema_base64",)
    SCHEMA_BASE64_FIELD_NUMBER: _ClassVar[int]
    schema_base64: str
    def __init__(self, schema_base64: _Optional[str] = ...) -> None: ...

class CreateOasfAppResponse(_message.Message):
    __slots__ = ("app", "badge")
    APP_FIELD_NUMBER: _ClassVar[int]
    BADGE_FIELD_NUMBER: _ClassVar[int]
    app: _app_pb2.App
    badge: _badge_pb2.Badge
    def __init__(self, app: _Optional[_Union[_app_pb2.App, _Mapping]] = ..., badge: _Optional[_Union[_badge_pb2.Badge, _Mapping]] = ...) -> None: ...

class GetAppsCountRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class AppTypeCountEntry(_message.Message):
    __slots__ = ("key", "value")
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    key: _app_pb2.AppType
    value: int
    def __init__(self, key: _Optional[_Union[_app_pb2.AppType, str]] = ..., value: _Optional[int] = ...) -> None: ...

class GetAppsCountResponse(_message.Message):
    __slots__ = ("counts", "total")
    COUNTS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    counts: _containers.RepeatedCompositeFieldContainer[AppTypeCountEntry]
    total: int
    def __init__(self, counts: _Optional[_Iterable[_Union[AppTypeCountEntry, _Mapping]]] = ..., total: _Optional[int] = ...) -> None: ...

class GetAppRequest(_message.Message):
    __slots__ = ("app_id",)
    APP_ID_FIELD_NUMBER: _ClassVar[int]
    app_id: str
    def __init__(self, app_id: _Optional[str] = ...) -> None: ...

class UpdateAppRequest(_message.Message):
    __slots__ = ("app_id", "app")
    APP_ID_FIELD_NUMBER: _ClassVar[int]
    APP_FIELD_NUMBER: _ClassVar[int]
    app_id: str
    app: _app_pb2.App
    def __init__(self, app_id: _Optional[str] = ..., app: _Optional[_Union[_app_pb2.App, _Mapping]] = ...) -> None: ...

class DeleteAppRequest(_message.Message):
    __slots__ = ("app_id",)
    APP_ID_FIELD_NUMBER: _ClassVar[int]
    app_id: str
    def __init__(self, app_id: _Optional[str] = ...) -> None: ...

class RefreshAppApiKeyRequest(_message.Message):
    __slots__ = ("app_id",)
    APP_ID_FIELD_NUMBER: _ClassVar[int]
    app_id: str
    def __init__(self, app_id: _Optional[str] = ...) -> None: ...

class GetBadgeRequest(_message.Message):
    __slots__ = ("app_id",)
    APP_ID_FIELD_NUMBER: _ClassVar[int]
    app_id: str
    def __init__(self, app_id: _Optional[str] = ...) -> None: ...

class GetTasksRequest(_message.Message):
    __slots__ = ("exclude_app_ids",)
    EXCLUDE_APP_IDS_FIELD_NUMBER: _ClassVar[int]
    exclude_app_ids: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, exclude_app_ids: _Optional[_Iterable[str]] = ...) -> None: ...

class GetTasksResponse(_message.Message):
    __slots__ = ("result",)
    class TaskList(_message.Message):
        __slots__ = ("tasks",)
        TASKS_FIELD_NUMBER: _ClassVar[int]
        tasks: _containers.RepeatedCompositeFieldContainer[_policy_pb2.Task]
        def __init__(self, tasks: _Optional[_Iterable[_Union[_policy_pb2.Task, _Mapping]]] = ...) -> None: ...
    class ResultEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: GetTasksResponse.TaskList
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[GetTasksResponse.TaskList, _Mapping]] = ...) -> None: ...
    RESULT_FIELD_NUMBER: _ClassVar[int]
    result: _containers.MessageMap[str, GetTasksResponse.TaskList]
    def __init__(self, result: _Optional[_Mapping[str, GetTasksResponse.TaskList]] = ...) -> None: ...
