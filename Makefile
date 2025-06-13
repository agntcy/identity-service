# Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0

.PHONY: do_generate_proto do_start_backend do_stop_backend do_start_docs do_stop_docs

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

do_stop_docs:
	./deployments/scripts/docs/stop.sh
	@echo "Docs stopped"

do_start_docs:
	./deployments/scripts/docs/launch.sh
	@echo "Docs started at http://localhost:3010"

generate_proto: do_generate_proto

stop_backend: do_stop_backend
start_backend: do_start_backend

start_docs: do_start_docs
stop_docs: do_stop_docs
