# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

FROM python:3.12-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /code
COPY ./samples/agent/oasf/financial_assistant/* .
RUN pip install --no-cache-dir .

# Copy UI files to ui directory
COPY ./samples/agent/oasf/financial_assistant/ui/ ./ui/

# Expose only one port for uvicorn
EXPOSE 9093

CMD ["python", "main.py"]
