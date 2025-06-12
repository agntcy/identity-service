.PHONY: proto
proto:
	mkdir -p build
	go build -o build/protoc-gen-go-srvreg .
	export PATH=$(CURDIR)/build/:$$PATH
