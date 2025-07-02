# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""Logging configuration for the application."""

import logging
import os


def configure():
    """Configure the logging for the application."""
    level = os.getenv("LOG_LEVEL", "DEBUG")
    if level == "INFO":
        logging.basicConfig(format="%(name)s: %(message)s", level=level)
    else:
        logging.basicConfig(
            format=
            "%(asctime)s,%(msecs)d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s",
            datefmt="%Y-%m-%d:%H:%M:%S",
            level=level,
        )
