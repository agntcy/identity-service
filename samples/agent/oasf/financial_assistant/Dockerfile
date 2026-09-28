# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

FROM python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /code
COPY ./samples/agent/oasf/financial_assistant/* .
RUN pip install --no-cache-dir --require-hashes -r requirements.txt

# Copy UI files to ui directory
COPY ./samples/agent/oasf/financial_assistant/ui/ ./ui/

# Expose only one port for uvicorn
EXPOSE 9093

CMD ["python", "main.py"]
