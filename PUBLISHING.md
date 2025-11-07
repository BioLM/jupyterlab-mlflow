# Publishing Guide

This document describes how to publish the JupyterLab MLflow extension to PyPI.

## Automated Publishing (Recommended)

The extension uses GitHub Actions to automatically publish to PyPI when a new release is created.

### Prerequisites

1. **PyPI Account**: You need a PyPI account with access to the `jupyterlab-mlflow` project
2. **PyPI Trusted Publishing**: Set up trusted publishing to allow GitHub Actions to publish without storing API tokens

### Setting Up PyPI Trusted Publishing

1. Go to your PyPI project settings:
   - Navigate to: https://pypi.org/manage/project/jupyterlab-mlflow/settings/publishing/
   - Or: PyPI → Your Projects → jupyterlab-mlflow → Settings → Publishing

2. Add a Trusted Publisher:
   - Click "Add" under "Trusted Publishers"
   - Fill in:
     - **PyPI project name**: `jupyterlab-mlflow`
     - **Owner**: `BioLM` (your GitHub organization/username)
     - **Repository name**: `jupyterlab-mlflow`
     - **Workflow filename**: `publish.yml`
   - Click "Add"

### Creating a Release

1. **Update Version**:
   - Update the version in `package.json` (e.g., `0.1.0` → `0.2.0`)
   - The Python version will be synced automatically via `hatch-nodejs-version`

2. **Commit and Tag**:
   ```bash
   git add package.json
   git commit -m "Bump version to 0.2.0"
   git tag v0.2.0
   git push origin main
   git push origin v0.2.0
   ```

3. **Create GitHub Release**:
   - Go to: https://github.com/BioLM/jupyterlab-mlflow/releases/new
   - Select the tag you just created (e.g., `v0.2.0`)
   - Add release notes
   - Click "Publish release"

4. **Monitor the Workflow**:
   - Go to: https://github.com/BioLM/jupyterlab-mlflow/actions
   - The `Publish to PyPI` workflow should start automatically
   - Wait for it to complete successfully

## Manual Publishing

If you need to publish manually:

1. **Build the Package**:
   ```bash
   # Install build dependencies
   pip install build hatchling hatch-nodejs-version
   
   # Build the extension
   npm run build:prod
   
   # Build Python package
   python -m build
   ```

2. **Test the Build**:
   ```bash
   # Install from local wheel
   pip install dist/jupyterlab_mlflow-*.whl
   
   # Verify installation
   jupyter labextension list | grep jupyterlab-mlflow
   ```

3. **Upload to PyPI**:
   ```bash
   # Install twine
   pip install twine
   
   # Upload to PyPI
   twine upload dist/*
   
   # Or upload to TestPyPI first
   twine upload --repository testpypi dist/*
   ```

## Version Management

- Version is managed in `package.json` under the `version` field
- Python version is automatically synced via `hatch-nodejs-version` (configured in `pyproject.toml`)
- Follow [Semantic Versioning](https://semver.org/):
  - **MAJOR**: Breaking changes
  - **MINOR**: New features (backward compatible)
  - **PATCH**: Bug fixes (backward compatible)

## Troubleshooting

### Workflow Fails with Authentication Error

- Verify PyPI trusted publishing is configured correctly
- Check that the workflow filename matches exactly: `publish.yml`
- Ensure the repository owner matches: `BioLM`

### Build Fails

- Check that all dependencies are listed in `pyproject.toml`
- Verify `package.json` has correct version
- Ensure `jupyterlab_mlflow/labextension` exists after building

### Package Not Appearing on PyPI

- Check workflow logs for errors
- Verify the package name matches: `jupyterlab-mlflow`
- Wait a few minutes for PyPI to process the upload

