# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM python:3.12-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /code
COPY ./samples/agent/a2a/currency_exchange/* .
RUN pip install --no-cache-dir .

CMD ["python", "main.py"]
