SHELL = /bin/bash -eu -o pipefail

HELM_DOCS_VERSION ?= v1.14.2
LOCALBIN ?= $(shell pwd)/bin

.PHONY: helm-docs
helm-docs: $(LOCALBIN)/helm-docs
	$(LOCALBIN)/helm-docs --chart-search-root charts/

$(LOCALBIN)/helm-docs:
	@mkdir -p $(LOCALBIN)
	GOBIN=$(LOCALBIN) go install github.com/norwoodj/helm-docs/cmd/helm-docs@$(HELM_DOCS_VERSION)
