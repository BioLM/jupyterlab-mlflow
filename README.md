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

This package uses automatic version bumping and is published to PyPI when a new release is created on GitHub.

### Automatic Version Bumping

Version bumping is handled automatically by `semantic-release` based on commit messages:

- `feat: something` → minor version bump (0.1.0 → 0.2.0)
- `fix: something` → patch version bump (0.1.0 → 0.1.1)
- `BREAKING: something` → major version bump (0.1.0 → 1.0.0)

When you push to `main`, semantic-release will:
1. Analyze commits since last release
2. Bump version in `package.json` (if needed)
3. Create a git tag
4. Push the tag to GitHub

### Publishing to PyPI

1. **Create a GitHub Release:**
   - Go to: https://github.com/BioLM/jupyterlab-mlflow/releases/new
   - Select the tag created by semantic-release (e.g., `v0.2.0`)
   - Add release notes
   - Click "Publish release"

2. **Automatic Publishing:**
   - The publish workflow automatically builds and publishes to PyPI
   - No manual steps required after creating the release

See [PUBLISHING.md](PUBLISHING.md) for detailed instructions.

## License

BSD-3-Clause

