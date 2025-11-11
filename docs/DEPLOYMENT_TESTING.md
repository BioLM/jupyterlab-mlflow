# Deployment Testing Guide

This guide explains how to test the full deployment pipeline for the jupyterlab-mlflow extension.

## Overview

The deployment test suite verifies:
1. **Build**: Package builds correctly (TypeScript + JupyterLab extension)
2. **Publish** (optional): Package can be published to TestPyPI
3. **Install**: Package can be installed from TestPyPI or local wheel
4. **Verify**: Extension works after installation (end-to-end tests)

## Quick Start

### Test Build Only
```bash
./scripts/test_deployment.sh
```

### Test Build + Installation
```bash
SKIP_INSTALL_TEST=false ./scripts/test_deployment.sh
```

### Test Full Pipeline (Build + Publish + Install + E2E)
```bash
PUBLISH_TO_TESTPYPI=true TESTPYPI_TOKEN=your_token ./scripts/test_deployment.sh
```

## Test Scripts

### `scripts/test_deployment.sh`
Comprehensive deployment test that covers the full pipeline:
- Builds the package
- Optionally publishes to TestPyPI
- Tests installation in a virtual environment
- Runs end-to-end tests

**Options:**
- `PUBLISH_TO_TESTPYPI=true` - Publish to TestPyPI (requires `TESTPYPI_TOKEN`)
- `SKIP_BUILD=true` - Skip the build step
- `SKIP_INSTALL_TEST=true` - Skip installation verification

### `scripts/run_e2e_test.sh`
End-to-end test that:
- Spins up fresh JupyterLab in Docker
- Installs extension from TestPyPI
- Runs Playwright browser tests

**Options:**
- `PUBLISH_TO_TESTPYPI=true` - Publish before testing
- `EXTENSION_VERSION=X.Y.Z` - Version to test
- `USE_EXISTING_CONTAINER=true` - Reuse existing Docker containers
- `HEADLESS=false` - Run browser in visible mode

### `scripts/publish_to_testpypi.sh`
Builds and publishes to TestPyPI:
- Cleans previous builds
- Builds TypeScript and JupyterLab extension
- Builds Python package
- Publishes to TestPyPI (requires `TESTPYPI_TOKEN`)

## TestPyPI Setup

1. Create account at https://test.pypi.org/
2. Generate API token at https://test.pypi.org/manage/account/token/
3. Set environment variable:
   ```bash
   export TESTPYPI_TOKEN="pypi-xxxxx"
   ```

## Testing Scenarios

### Scenario 1: Local Build Test
Test that the package builds correctly:
```bash
SKIP_INSTALL_TEST=true ./scripts/test_deployment.sh
```

### Scenario 2: Installation Test
Test that the built package can be installed:
```bash
./scripts/test_deployment.sh
```

### Scenario 3: TestPyPI Deployment
Test the full deployment to TestPyPI:
```bash
PUBLISH_TO_TESTPYPI=true TESTPYPI_TOKEN=your_token ./scripts/test_deployment.sh
```

### Scenario 4: Fresh Installation from TestPyPI
Test installing from TestPyPI in a clean environment:
```bash
EXTENSION_VERSION=0.3.0 USE_EXISTING_CONTAINER=false ./scripts/run_e2e_test.sh
```

## Verification Steps

After deployment, verify:

1. **Python Package**: `python -c "import jupyterlab_mlflow"`
2. **Lab Extension**: `jupyter labextension list | grep jupyterlab-mlflow`
3. **Server Extension**: `jupyter server extension list | grep jupyterlab_mlflow`
4. **Browser Test**: Run e2e tests to verify UI works

## Troubleshooting

### Build Fails
- Check Node.js and npm versions
- Run `npm ci` to ensure dependencies are correct
- Check TypeScript compilation errors

### Publish Fails
- Verify `TESTPYPI_TOKEN` is set correctly
- Check if version already exists on TestPyPI (must be unique)
- Ensure package.json version is incremented

### Installation Fails
- Check Python version (>=3.8)
- Verify JupyterLab is installed
- Check for conflicting packages

### E2E Tests Fail
- Ensure Docker is running
- Check JupyterLab server logs: `docker-compose -f docker-compose.test.yml logs jupyterlab`
- Verify extension is actually installed in container

## CI/CD Integration

The deployment test can be integrated into CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Test Deployment
  run: |
    export TESTPYPI_TOKEN=${{ secrets.TESTPYPI_TOKEN }}
    ./scripts/test_deployment.sh
```

## Next Steps

After successful deployment testing:
1. Test on different Python versions
2. Test on different JupyterLab versions
3. Test on different operating systems
4. Prepare for production PyPI release

