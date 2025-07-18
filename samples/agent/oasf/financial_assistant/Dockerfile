# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM python:3.12-slim

WORKDIR /code
COPY ./samples/agent/oasf/financial_assistant/* .
COPY ./sdk/python/ ./sdk/python/
RUN pip install --no-cache-dir .

# Install identity platform dependency
RUN pip install sdk/python

# Copy UI files to ui directory
COPY ./samples/agent/oasf/financial_assistant/ui/ ./ui/

# Expose only one port for uvicorn
EXPOSE 9093

CMD ["python", "main.py"]
