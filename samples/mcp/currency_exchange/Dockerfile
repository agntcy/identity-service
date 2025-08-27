# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM python:3.12-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /code
COPY ./samples/mcp/currency_exchange/* .
RUN pip install --no-cache-dir .

# legit:ignore-pipeline
RUN pip install --no-cache-dir git+https://github.com/cisco-outshift-ai-agents/identity-service-sdk.git#subdirectory=python # legit:ignore-pipeline

CMD ["python", "main.py"]
