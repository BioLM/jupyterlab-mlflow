# Makefile for JupyterLab MLflow Extension Development

# Configuration
PYTHON_VERSION := 3.9
JUPYTERLAB_CORE_PATH := $(HOME)/Library/Python/$(PYTHON_VERSION)/lib/python/site-packages/jupyterlab/staging
LABEXTENSION_PATH := $(HOME)/Library/Python/$(PYTHON_VERSION)/share/jupyter/labextensions/jupyterlab-mlflow
SOURCE_LABEXTENSION := jupyterlab_mlflow/labextension

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

.PHONY: help build build-lib build-labextension install clean install-deps rebuild dev-install

help: ## Show this help message
	@echo "JupyterLab MLflow Extension - Development Makefile"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

build-lib: ## Build TypeScript source files
	@echo "$(YELLOW)Building TypeScript...$(NC)"
	npm run build:lib

build-labextension: build-lib ## Build JupyterLab extension bundle
	@echo "$(YELLOW)Building labextension...$(NC)"
	node node_modules/@jupyterlab/builder/lib/build-labextension.js . --core-path $(JUPYTERLAB_CORE_PATH)

install: build-labextension ## Install extension to JupyterLab (removes old, copies new)
	@echo "$(YELLOW)Installing extension...$(NC)"
	@if [ -d "$(LABEXTENSION_PATH)" ]; then \
		rm -rf "$(LABEXTENSION_PATH)"; \
	fi
	@cp -r $(SOURCE_LABEXTENSION) "$(LABEXTENSION_PATH)"
	@echo "$(GREEN)✅ Extension installed to $(LABEXTENSION_PATH)$(NC)"

rebuild: clean build-labextension install ## Clean, build, and install extension

dev-install: build-labextension ## Quick install for development (assumes build already done)
	@echo "$(YELLOW)Installing extension (dev mode)...$(NC)"
	@if [ -d "$(LABEXTENSION_PATH)" ]; then \
		rm -rf "$(LABEXTENSION_PATH)"; \
	fi
	@cp -r $(SOURCE_LABEXTENSION) "$(LABEXTENSION_PATH)"
	@echo "$(GREEN)✅ Extension installed$(NC)"

clean: ## Clean build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf lib
	@rm -rf jupyterlab_mlflow/labextension
	@rm -rf tsconfig.tsbuildinfo
	@echo "$(GREEN)✅ Cleaned$(NC)"

install-deps: ## Install npm and Python dependencies
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

build: build-labextension ## Alias for build-labextension

# Default target
.DEFAULT_GOAL := help

