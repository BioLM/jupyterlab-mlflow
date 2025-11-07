# JupyterLab MLflow Extension

A JupyterLab extension for browsing MLflow experiments, runs, models, and artifacts directly from the JupyterLab sidebar.

## Features

- Browse MLflow experiments, runs, models, and artifacts
- Tree and list views for easy navigation
- View artifacts in new JupyterLab tabs
- Copy experiment/run/model IDs to clipboard
- Connect to remote MLflow tracking servers
- Settings UI with environment variable fallback

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
git clone https://github.com/yourusername/jupyterlab-mlflow.git
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

## License

BSD-3-Clause

