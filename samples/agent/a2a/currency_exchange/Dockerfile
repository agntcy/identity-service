# Copyright 2025 Cisco Systems, Inc. and its affiliates
# SPDX-License-Identifier: Apache-2.0

FROM python:3.12-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /code
COPY ./samples/agent/a2a/currency_exchange/* .
RUN pip install --no-cache-dir .
RUN pip install --no-cache-dir git+https://github.com/cisco-outshift-ai-agents/identity-service-sdk.git#subdirectory=python # legit:ignore-pipeline

CMD ["python", "main.py"]
