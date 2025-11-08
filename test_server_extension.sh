#!/bin/bash
# Quick test script for server extension fixes
# Tests the server extension without going through PyPI

set -e

echo "🧪 Testing Server Extension Locally"
echo "===================================="
echo ""

# Step 1: Build the extension
echo "📦 Step 1: Building extension..."
npm run clean:lib
npm run clean:labextension
npm run build:lib
jupyter labextension build --development .
echo "✅ Extension built"
echo ""

# Step 2: Install in editable mode
echo "📦 Step 2: Installing package in editable mode..."
pip install -e . --quiet
echo "✅ Package installed"
echo ""

# Step 3: Enable server extension
echo "⚙️  Step 3: Enabling server extension..."
jupyter server extension enable jupyterlab_mlflow.serverextension --sys-prefix 2>/dev/null || \
jupyter server extension enable jupyterlab_mlflow.serverextension 2>/dev/null || \
echo "⚠️  Extension may already be enabled"
echo ""

# Step 4: Verify extension is enabled
echo "🔍 Step 4: Verifying server extension..."
if jupyter server extension list | grep -q "jupyterlab_mlflow.serverextension.*enabled"; then
    echo "✅ Server extension is enabled"
else
    echo "⚠️  Server extension may not be listed as enabled"
    echo "   This might be OK if it auto-loads"
fi
echo ""

# Step 5: Build a test wheel (optional, for testing actual installation)
echo "📦 Step 5: Building test wheel..."
python -m build --wheel 2>/dev/null || echo "⚠️  Build tools not available, skipping wheel build"
echo ""

echo "✅ Setup complete!"
echo ""
echo "🧪 Testing Options:"
echo ""
echo "Option 1: Test with JupyterLab (recommended)"
echo "  1. Start JupyterLab:"
echo "     jupyter lab"
echo ""
echo "  2. Open browser console (F12) and check for errors"
echo "  3. Try to connect to an MLflow server in the extension"
echo "  4. Check JupyterLab server logs for handler registration messages"
echo ""
echo "Option 2: Test API endpoints directly"
echo "  1. Start JupyterLab in one terminal:"
echo "     jupyter lab --no-browser"
echo ""
echo "  2. In another terminal, test the API:"
echo "     curl http://localhost:8888/mlflow/api/connection/test?tracking_uri=http://localhost:5000"
echo ""
echo "  3. Check for 200 response (not 404)"
echo ""
echo "Option 3: Install from local wheel"
echo "  1. Build wheel: python -m build --wheel"
echo "  2. Install: pip install dist/jupyterlab_mlflow-*.whl"
echo "  3. Enable: jupyter server extension enable jupyterlab_mlflow.serverextension"
echo "  4. Start: jupyter lab"
echo ""
echo "📝 To check server extension logs:"
echo "   Look for 'Registered jupyterlab-mlflow API handlers' in JupyterLab startup logs"
echo ""

