# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

.PHONY: do_generate_proto do_generate_mocks do_generate_go_sdk do_start_backend do_stop_backend do_start_docs do_stop_docs do_start_frontend do_stop_frontend

do_generate_proto:
	cd scripts/proto && ./generate.sh
	@echo "Generated proto files"

do_generate_mocks:
	cd scripts && ./mockery.sh
	@echo "Generated GO mocks with Mockery"

do_generate_go_sdk:
	chmod +x scripts/gosdk/generate.sh
	./scripts/gosdk/generate.sh
	@echo "Generated backend Go SDK"

do_start_backend:
	@./deployments/scripts/backend/launch.sh ${dev}
	@echo "Postgres started at :5984"
	@echo "Backend started at :4000"

do_stop_backend:
	@./deployments/scripts/backend/stop.sh
	@echo "Backend stopped"
	@echo "Postgres stopped"

do_stop_docs:
	./deployments/scripts/docs/stop.sh
	@echo "Docs stopped"

do_start_docs:
	./deployments/scripts/docs/launch.sh
	@echo "Docs started at http://localhost:3010"

do_stop_frontend:
	./deployments/scripts/frontend/stop.sh
	@echo "Frontend stopped"

do_start_frontend:
	./deployments/scripts/frontend/launch.sh
	@echo "Frontend started at http://localhost:5500"

generate_proto: do_generate_proto

generate_mocks: do_generate_mocks

generate_go_sdk: do_generate_go_sdk

stop_backend: do_stop_backend
start_backend: do_start_backend

start_docs: do_start_docs
stop_docs: do_stop_docs

stop_frontend: do_stop_frontend
start_frontend: do_start_frontend

start: do_start_backend do_start_frontend do_start_docs
stop: do_stop_frontend do_stop_backend do_stop_docs
