# End-to-End Testing Guide

This guide explains how to run end-to-end tests that verify the extension works correctly when installed from TestPyPI in a fresh JupyterLab environment.

## Overview

The e2e test process:
1. **Publishes to TestPyPI** - Builds and publishes the extension to TestPyPI
2. **Spins up Docker** - Creates a fresh JupyterLab instance in Docker
3. **Installs Extension** - Installs the extension from TestPyPI into the Docker container
4. **Runs Browser Tests** - Uses Playwright to test the extension in Chromium

## Prerequisites

- Docker and Docker Compose installed
- Python 3.11+ with pip
- Node.js and npm
- TestPyPI account and token (optional, for publishing)

## Quick Start

### Option 1: Full Test (Publish + Test)

```bash
# Set your TestPyPI token (get from https://test.pypi.org/manage/account/token/)
export TESTPYPI_TOKEN="pypi-xxxxx"

# Run the full test suite
PUBLISH_TO_TESTPYPI=true ./scripts/run_e2e_test.sh
```

### Option 2: Test Existing Version

If the extension is already published to TestPyPI:

```bash
# Test a specific version
EXTENSION_VERSION=0.3.0 ./scripts/run_e2e_test.sh

# Or test latest (auto-detected from package.json)
./scripts/run_e2e_test.sh
```

### Option 3: Manual Testing

1. Start the Docker containers:
```bash
docker-compose -f docker-compose.test.yml up -d
```

2. Install the extension manually:
```bash
docker-compose -f docker-compose.test.yml exec jupyterlab bash -c \
  "pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ jupyterlab-mlflow==0.3.0"
```

3. Enable server extension:
```bash
docker-compose -f docker-compose.test.yml exec jupyterlab bash -c \
  "jupyter server extension enable jupyterlab_mlflow.serverextension"
```

4. Restart JupyterLab:
```bash
docker-compose -f docker-compose.test.yml restart jupyterlab
```

5. Open in browser:
   - Navigate to http://localhost:8888/lab
   - Verify the extension appears and works

## Configuration

### Environment Variables

- `PUBLISH_TO_TESTPYPI` - Set to `true` to publish before testing (default: `false`)
- `EXTENSION_VERSION` - Version to test (default: auto-detected from package.json)
- `USE_EXISTING_CONTAINER` - Reuse existing containers (default: `false`)
- `HEADLESS` - Run browser in headless mode (default: `true`)
- `KEEP_CONTAINERS` - Keep containers running after tests (default: `false`)
- `TESTPYPI_TOKEN` - TestPyPI API token for publishing

### TestPyPI Token

To get a TestPyPI token:
1. Go to https://test.pypi.org/manage/account/token/
2. Create a new API token
3. Set it as an environment variable: `export TESTPYPI_TOKEN="pypi-xxxxx"`

## Test Structure

### Directory Structure

All test artifacts are stored in `e2e_test/` (gitignored):
- `e2e_test/work/` - JupyterLab working directory
- `e2e_test/mlruns/` - MLflow test data
- `e2e_test/screenshots/` - Playwright test screenshots

### Docker Setup

- `Dockerfile.test` - Fresh JupyterLab environment
- `docker-compose.test.yml` - Orchestrates JupyterLab + optional MLflow server

### Playwright Tests

Tests are in `tests/e2e/test_extension_installation.py`:

- `test_jupyterlab_loads` - Verifies JupyterLab starts
- `test_extension_appears_in_sidebar` - Checks extension appears in UI
- `test_no_console_errors` - Verifies no JavaScript errors
- `test_extension_settings_accessible` - Tests settings access
- `test_extension_widget_renders` - Verifies widget rendering

## Debugging

### View Container Logs

```bash
docker-compose -f docker-compose.test.yml logs -f jupyterlab
```

### Access Container Shell

```bash
docker-compose -f docker-compose.test.yml exec jupyterlab bash
```

### Run Tests with Browser Visible

```bash
HEADLESS=false ./scripts/run_e2e_test.sh
```

### Check Extension Installation

```bash
docker-compose -f docker-compose.test.yml exec jupyterlab bash -c \
  "jupyter labextension list"
```

### Check Server Extension

```bash
docker-compose -f docker-compose.test.yml exec jupyterlab bash -c \
  "jupyter server extension list"
```

## Troubleshooting

### Extension Not Appearing

1. Check if extension is installed:
   ```bash
   docker-compose -f docker-compose.test.yml exec jupyterlab bash -c \
     "pip list | grep jupyterlab-mlflow"
   ```

2. Check browser console for errors (set `HEADLESS=false`)

3. Verify extension files:
   ```bash
   docker-compose -f docker-compose.test.yml exec jupyterlab bash -c \
     "ls -la /home/jupyter/.local/share/jupyter/labextensions/"
   ```

### TestPyPI Installation Fails

- Ensure you're using `--extra-index-url` to pull dependencies from PyPI
- Check that the version exists on TestPyPI
- Verify network connectivity

### Docker Issues

- Ensure Docker is running: `docker ps`
- Check container status: `docker-compose -f docker-compose.test.yml ps`
- Restart containers: `docker-compose -f docker-compose.test.yml restart`

## CI/CD Integration

To run in CI:

```yaml
- name: Run E2E Tests
  run: |
    export TESTPYPI_TOKEN=${{ secrets.TESTPYPI_TOKEN }}
    PUBLISH_TO_TESTPYPI=true ./scripts/run_e2e_test.sh
```

## Next Steps

After e2e tests pass:
1. Review test results and screenshots
2. Fix any issues found
3. Publish to production PyPI
4. Run e2e tests against production version

