# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM python:3.12-slim

WORKDIR /code
COPY ./samples/agent/a2a/currency_exchange/* .
COPY ./sdk/python/ ./sdk/python/
RUN pip install --no-cache-dir .

# Install identity service dependency
RUN pip install ./sdk/python/

CMD ["python", "main.py"]
