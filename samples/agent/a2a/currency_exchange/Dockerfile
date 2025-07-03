# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM python:3.12-slim

WORKDIR /code
COPY ./* .
RUN pip install --no-cache-dir .

CMD ["python", "main.py", "--ollama-host", "http://host.docker.internal:11434", "--mcp-server-url", "http://identity-samples-currency-exchange-mcp-server:9090/mcp"]
