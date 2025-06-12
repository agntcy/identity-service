# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

.PHONY: do_generate_proto do_generate_backend_sdk do_start_backend

do_generate_proto:
	cd scripts/proto && ./generate.sh
	@echo "Generated proto files"

do_start_backend:
	@./deployments/scripts/backend/launch.sh ${dev}
	@echo "Postgres started at :5984"
	@echo "Backend started at :4000"

do_stop_backend:
	@./deployments/scripts/backend/stop.sh
	@echo "Backend stopped"
	@echo "Postgres stopped"

generate_proto: do_generate_proto

stop_backend: do_stop_backend
start_backend: do_start_backend
