# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Unit tests for identityservice.badge.oasf."""

from pathlib import Path

import pytest

from identityservice.badge import oasf
from identityservice.exceptions import SdkError


def test_discover_success(tmp_path: Path):
    """discover should return file contents when file exists and is non-empty."""
    schema_path = tmp_path / "oasf.json"
    content = '{"version": "1.0.0", "name": "Test OASF Agent"}'
    schema_path.write_text(content, encoding="utf-8")

    result = oasf.discover(str(schema_path))

    assert result == content


def test_discover_raises_when_file_missing():
    """discover should raise SdkError when file does not exist."""
    with pytest.raises(SdkError) as excinfo:
        oasf.discover("/non/existent/oasf.json")

    assert "OASF schema file not found" in str(excinfo.value)


def test_discover_raises_when_file_empty(tmp_path: Path):
    """discover should raise SdkError when file is empty."""
    schema_path = tmp_path / "empty.json"
    schema_path.write_text("", encoding="utf-8")

    with pytest.raises(SdkError) as excinfo:
        oasf.discover(str(schema_path))

    assert "OASF schema file is empty" in str(excinfo.value)
