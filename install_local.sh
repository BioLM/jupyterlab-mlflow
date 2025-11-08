#!/bin/bash
# Install local version of jupyterlab-mlflow (replaces PyPI version)

set -e

echo "🔄 Replacing PyPI version with local GitHub version..."
echo ""

# Uninstall existing version
echo "📦 Step 1: Uninstalling existing version..."
pip uninstall jupyterlab-mlflow -y 2>/dev/null || echo "  (No existing installation found)"
echo ""

# Build the extension first
echo "🔨 Step 2: Building extension..."
npm run clean:lib
npm run clean:labextension
npm run build:lib
npm run build:labextension:dev 2>/dev/null || echo "  (Build may have issues, continuing anyway)"
echo ""

# Install in editable mode
echo "📦 Step 3: Installing local version (editable mode)..."
pip install -e .
echo ""

# Enable server extension
echo "⚙️  Step 4: Enabling server extension..."
jupyter server extension enable jupyterlab_mlflow.serverextension --sys-prefix 2>/dev/null || \
jupyter server extension enable jupyterlab_mlflow.serverextension 2>/dev/null || \
echo "  (Extension may already be enabled)"
echo ""

echo "✅ Installation complete!"
echo ""
echo "📝 Verify installation:"
echo "  pip show jupyterlab-mlflow"
echo "  jupyter server extension list | grep mlflow"
echo ""
echo "🚀 Start JupyterLab:"
echo "  jupyter lab"
echo ""

