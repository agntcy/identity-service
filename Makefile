# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

.PHONY: do_generate_proto do_generate_backend_sdk do_start_backend

do_generate_proto:
	cd scripts/proto && ./generate.sh
	@echo "Generated proto files"

do_generate_backend_sdk:
	chmod +x scripts/backend/generate.sh
	./scripts/backend/generate.sh
	@echo "Generated Backend SDK"

do_start_backend:
	@./deployments/scripts/backend/launch_backend.sh ${dev}
	@echo "Postgres started at :5984"
	@echo "Backend started at :4000"

do_stop_backend:
	@./deployments/scripts/backend/stop_backend.sh
	@echo "Backend stopped"
	@echo "Postgres stopped"

generate_proto: do_generate_proto

generate_backend_sdk: do_generate_backend_sdk

stop_backend: do_stop_backend
start_backend: do_start_backend
