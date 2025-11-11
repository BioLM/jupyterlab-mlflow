# CI/CD and Publishing Setup Guide for JupyterLab Extensions

This guide provides a complete setup for automated semantic versioning, CI/CD, and publishing to PyPI/NPM for JupyterLab extensions.

## Overview

This setup provides:
- **Automatic semantic versioning** based on conventional commits
- **GitHub Actions CI** with test matrix and automatic version bumping
- **Automated PyPI publishing** via GitHub releases
- **PyPI trusted publishing** (no API tokens required)
- **Version synchronization** between `package.json` and Python package

## Workflow

1. Developer commits with conventional commit format (`feat:`, `fix:`, `BREAKING:`)
2. CI workflow runs tests and semantic-release
3. semantic-release analyzes commits and bumps version if needed
4. Git tag is created and pushed automatically
5. Developer creates GitHub release from the tag
6. Publish workflow automatically builds and publishes to PyPI

## Step 1: Install Dependencies

Add these to your `package.json` `devDependencies`:

```json
{
  "devDependencies": {
    "@semantic-release/commit-analyzer": "^13.0.1",
    "@semantic-release/git": "^10.0.1",
    "@semantic-release/github": "^11.0.6",
    "@semantic-release/npm": "^12.0.2",
    "@semantic-release/release-notes-generator": "^12.1.0",
    "semantic-release": "^24.2.9"
  }
}
```

## Step 2: Configure package.json

Add/update these scripts in `package.json`:

```json
{
  "scripts": {
    "build:prod": "jlpm clean && jlpm build:lib && jlpm build:labextension",
    "prepack": "jlpm clean && jlpm build:prod"
  }
}
```

## Step 3: Configure pyproject.toml

Add version synchronization and build hooks:

```toml
[build-system]
requires = ["hatchling>=1.5.0", "jupyterlab>=4.0.0,<5", "hatch-nodejs-version>=0.3.2"]
build-backend = "hatchling.build"

[project]
# ... your project config ...
dynamic = ["version"]

[tool.hatch.version]
source = "nodejs"

[tool.jupyter-releaser.options]
version_cmd = "hatchling version"

[tool.jupyter-releaser.hooks]
before-build-npm = ["python -m pip install 'jupyterlab>=4.0.0,<5'", "jlpm", "jlpm build:prod"]
before-build-python = ["jlpm clean:all"]
```

## Step 4: Create CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11']
        node-version: ['18', '20']

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install JupyterLab
        run: |
          python -m pip install --upgrade pip
          pip install "jupyterlab>=4.0.0,<5"

      - name: Install Node.js dependencies
        run: |
          npm install -g npm
          npm ci

      - name: Install Python dependencies
        run: |
          pip install -e .[test]

      - name: Build extension
        run: |
          npm run clean:lib
          npm run clean:labextension
          npm run build:lib
          python -m jupyter labextension build .

      - name: Install build dependencies
        run: |
          pip install build hatchling hatch-nodejs-version

      - name: Build Python package
        run: |
          python -m build

      - name: Check package contents
        run: |
          pip install check-wheel-contents
          check-wheel-contents dist/*.whl || true

  version:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: write # Required to push version bumps and tags
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required for semantic-release to analyze commits
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Configure Git
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"

      - name: Install dependencies
        run: npm ci

      - name: Run semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx semantic-release
```

**Note:** The build process uses `@jupyterlab/builder` which handles all build steps automatically.

## Step 5: Create Publish Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to PyPI

on:
  release:
    types: [published]  # Triggers on manual GitHub releases only
  workflow_dispatch:  # Allow manual triggering

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install JupyterLab
        run: |
          python -m pip install --upgrade pip
          pip install "jupyterlab>=4.0.0,<5"

      - name: Install Node.js dependencies
        run: |
          npm install -g npm
          npm ci

      - name: Build extension
        run: |
          npm run clean:lib
          npm run clean:labextension
          npm run build:lib
          python -m jupyter labextension build .

      - name: Install build dependencies
        run: |
          pip install build hatchling hatch-nodejs-version

      - name: Build Python package
        run: |
          python -m build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: python-dist
          path: dist/
          retention-days: 7

  publish-testpypi:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'workflow_dispatch' && (github.event.inputs.repository == 'testpypi' || github.event.inputs.repository == '') || github.event_name == 'release' && contains(github.event.release.tag_name, 'rc')
    environment:
      name: testpypi
    permissions:
      id-token: write  # Required for TestPyPI trusted publishing
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: python-dist
          path: dist/

      - name: Publish package to TestPyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          packages-dir: dist/
          repository-url: https://test.pypi.org/legacy/

  publish-pypi:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'release' && !contains(github.event.release.tag_name, 'rc') || github.event_name == 'workflow_dispatch' && github.event.inputs.repository == 'pypi'
    environment:
      name: pypi
    permissions:
      id-token: write  # Required for PyPI trusted publishing
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: python-dist
          path: dist/

      - name: Publish package to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          packages-dir: dist/
```

## Step 6: Configure semantic-release

Create `.releaserc.json` or add to `package.json`:

```json
{
  "release": {
    "branches": ["main", "master"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      [
        "@semantic-release/npm",
        {
          "npmPublish": false
        }
      ],
      [
        "@semantic-release/git",
        {
          "assets": ["package.json"],
          "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
        }
      ],
      "@semantic-release/github"
    ]
  }
}
```

Or add to `package.json`:

```json
{
  "release": {
    "branches": ["main", "master"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      [
        "@semantic-release/npm",
        {
          "npmPublish": false
        }
      ],
      [
        "@semantic-release/git",
        {
          "assets": ["package.json"],
          "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
        }
      ],
      "@semantic-release/github"
    ]
  }
}
```

## Step 7: Set Up PyPI Trusted Publishing

1. Go to your PyPI project settings:
   - Navigate to: `https://pypi.org/manage/project/YOUR_PACKAGE_NAME/settings/publishing/`
   - Or: PyPI → Your Projects → YOUR_PACKAGE_NAME → Settings → Publishing

2. Add a Trusted Publisher:
   - Click "Add" under "Trusted Publishers"
   - Fill in:
     - **PyPI project name**: `YOUR_PACKAGE_NAME`
     - **Owner**: `YOUR_GITHUB_ORG` (your GitHub organization/username)
     - **Repository name**: `YOUR_REPO_NAME`
     - **Workflow filename**: `publish.yml`
   - Click "Add"

3. Repeat for TestPyPI if desired (optional):
   - Go to TestPyPI: `https://test.pypi.org/manage/project/YOUR_PACKAGE_NAME/settings/publishing/`
   - Add the same trusted publisher configuration

## Step 8: Using Conventional Commits

For automatic version bumping, use conventional commit messages:

- `feat: add new feature` → **minor** version bump (0.1.0 → 0.2.0)
- `fix: bug fix` → **patch** version bump (0.1.0 → 0.1.1)
- `BREAKING: major change` → **major** version bump (0.1.0 → 1.0.0)
- Regular commits without prefixes → **no** version bump

### Examples

```bash
# Minor version bump
git commit -m "feat: add new settings panel"

# Patch version bump
git commit -m "fix: resolve memory leak in artifact viewer"

# Major version bump
git commit -m "BREAKING: change API interface"

# No version bump
git commit -m "docs: update README"
```

## Step 9: Publishing Workflow

1. **Make changes and commit with conventional format:**
   ```bash
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **CI automatically runs:**
   - Tests pass
   - semantic-release analyzes commits
   - If version bump needed:
     - Version updated in `package.json`
     - Git tag created (e.g., `v0.2.0`)
     - Tag pushed to GitHub

3. **Create GitHub Release:**
   - Go to: `https://github.com/YOUR_ORG/YOUR_REPO/releases/new`
   - Select the tag created by semantic-release (e.g., `v0.2.0`)
   - Add release notes (or use auto-generated ones)
   - Click "Publish release"

4. **Publish workflow automatically:**
   - Builds the extension
   - Builds Python package
   - Publishes to PyPI

## Step 10: Create PUBLISHING.md Documentation

Create a `PUBLISHING.md` file with instructions for your team:

```markdown
# Publishing Guide

This document describes how to publish the extension to PyPI.

## Automated Publishing (Recommended)

The extension uses GitHub Actions to automatically publish to PyPI when a new release is created.

### Prerequisites

1. **PyPI Account**: You need a PyPI account with access to the project
2. **PyPI Trusted Publishing**: Set up trusted publishing (see SETUP_CI_CD.md)

### Creating a Release

1. **Commit with conventional format:**
   ```bash
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **Wait for CI to complete:**
   - CI runs tests
   - semantic-release bumps version and creates tag (if needed)

3. **Create GitHub Release:**
   - Go to: https://github.com/YOUR_ORG/YOUR_REPO/releases/new
   - Select the tag created by semantic-release
   - Add release notes
   - Click "Publish release"

4. **Monitor the Workflow:**
   - Go to: https://github.com/YOUR_ORG/YOUR_REPO/actions
   - The `Publish to PyPI` workflow should start automatically
   - Wait for it to complete successfully

## Version Management

- Version is managed in `package.json` under the `version` field
- Python version is automatically synced via `hatch-nodejs-version`
- **Automatic version bumping** is handled by `semantic-release` based on commit messages
- Follow [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/)

### Commit Message Format

- `feat: add new feature` → minor version bump (0.1.0 → 0.2.0)
- `fix: bug fix` → patch version bump (0.1.0 → 0.1.1)
- `BREAKING: major change` → major version bump (0.1.0 → 1.0.0)
- Regular commits without prefixes → no version bump
```

## Customization Points

### Adjust Test Matrix

Modify the Python/Node versions in `.github/workflows/ci.yml`:

```yaml
strategy:
  matrix:
    python-version: ['3.9', '3.10', '3.11']  # Adjust as needed
    node-version: ['18', '20']  # Adjust as needed
```

### Change Build Steps

If your extension has different build steps, modify the build sections in both workflows:

```yaml
- name: Build extension
  run: |
    npm run clean:lib
    npm run clean:labextension
    npm run build:lib
    python -m jupyter labextension build .
```

### NPM Publishing

If you also want to publish to NPM, modify the semantic-release config:

```json
{
  "@semantic-release/npm": {
    "npmPublish": true
  }
}
```

And add NPM_TOKEN secret to GitHub Actions.

## Troubleshooting

### semantic-release doesn't bump version

- Check that commits use conventional format (`feat:`, `fix:`, etc.)
- Verify `.releaserc.json` or `package.json` release config exists
- Check CI logs for semantic-release output

### PyPI publishing fails

- Verify PyPI trusted publishing is configured correctly
- Check that workflow filename matches: `publish.yml`
- Ensure repository owner matches PyPI trusted publisher config
- Check workflow logs for detailed error messages

### Version sync issues

- Verify `hatch-nodejs-version` is in `pyproject.toml` build requirements
- Check that `[tool.hatch.version]` has `source = "nodejs"`
- Ensure `package.json` has a valid version field

## Additional Resources

- [semantic-release documentation](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [PyPI Trusted Publishing](https://docs.pypi.org/trusted-publishers/)
- [Jupyter Releaser](https://github.com/jupyter-server/jupyter_releaser)

