from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class PagedResponse(_message.Message):
    __slots__ = ("next_page", "has_next_page", "total", "size")
    NEXT_PAGE_FIELD_NUMBER: _ClassVar[int]
    HAS_NEXT_PAGE_FIELD_NUMBER: _ClassVar[int]
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    SIZE_FIELD_NUMBER: _ClassVar[int]
    next_page: int
    has_next_page: bool
    total: int
    size: int
    def __init__(self, next_page: _Optional[int] = ..., has_next_page: _Optional[bool] = ..., total: _Optional[int] = ..., size: _Optional[int] = ...) -> None: ...
