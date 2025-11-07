# JupyterLab MLflow Extension

A JupyterLab extension for browsing MLflow experiments, runs, models, and artifacts directly from the JupyterLab sidebar.

## Features

- Browse MLflow experiments, runs, models, and artifacts
- Tree view for hierarchical navigation
- Details/Object view for exploring metadata and child objects
- View artifacts in new JupyterLab tabs
- Copy experiment/run/model IDs to clipboard
- Generate and insert MLflow Python API code snippets
- Connect to remote MLflow tracking servers
- Launch local MLflow server with SQLite backend
- Settings UI with environment variable fallback
- MLflow shortcuts panel for common operations

## Requirements

- JupyterLab >= 4.0.0
- Python >= 3.8
- MLflow >= 2.0.0

## Installation

```bash
pip install jupyterlab-mlflow
```

Or install from source:

```bash
git clone https://github.com/BioLM/jupyterlab-mlflow.git
cd jupyterlab-mlflow
pip install -e .
jlpm install
jlpm build
```

## Configuration

The extension can be configured via:

1. **Settings UI**: Open JupyterLab Settings → Advanced Settings Editor → MLflow
2. **Environment Variable**: Set `MLFLOW_TRACKING_URI` environment variable

## Usage

1. Configure your MLflow tracking URI in the settings or via environment variable
2. The MLflow sidebar will appear in the left sidebar
3. Browse experiments, runs, models, and artifacts
4. Click on artifacts to view them in new tabs
5. Right-click on items to copy IDs to clipboard

## Development

```bash
# Install dependencies
jlpm install

# Build the extension
jlpm build

# Watch for changes
jlpm watch

# Run tests
pytest
```

## Publishing

This package is automatically published to PyPI when a new release is created on GitHub.

### Setting Up Automated Publishing

1. **Configure PyPI Trusted Publishing:**
   - Go to https://pypi.org/manage/project/jupyterlab-mlflow/settings/publishing/
   - Add a trusted publisher with:
     - Owner: `BioLM`
     - Repository: `jupyterlab-mlflow`
     - Workflow name: `publish.yml`

2. **Create a GitHub Release:**
   - Update version in `package.json`
   - Tag and push: `git tag v0.1.0 && git push origin v0.1.0`
   - Create a release on GitHub with the same tag
   - The workflow will automatically build and publish to PyPI

See [PUBLISHING.md](PUBLISHING.md) for detailed instructions.

## License

BSD-3-Clause

