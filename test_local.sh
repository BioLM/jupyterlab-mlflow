#!/bin/bash
# Test script for local JupyterLab MLflow extension

set -e

echo "🚀 Setting up JupyterLab MLflow Extension for local testing..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: Please run this script from the jupyterlab-mlflow directory"
    exit 1
fi

# Step 1: Install Python dependencies
echo "📦 Step 1: Installing Python dependencies..."
pip install -e . --quiet
echo "✅ Python dependencies installed"
echo ""

# Step 2: Install Node dependencies
echo "📦 Step 2: Installing Node dependencies..."
jlpm install
echo "✅ Node dependencies installed"
echo ""

# Step 3: Build TypeScript
echo "🔨 Step 3: Building TypeScript..."
jlpm build:lib
echo "✅ TypeScript compiled"
echo ""

# Step 4: Build JupyterLab extension
echo "🔨 Step 4: Building JupyterLab extension..."
jlpm build:labextension:dev
echo "✅ JupyterLab extension built"
echo ""

# Step 5: Enable server extension
echo "⚙️  Step 5: Enabling server extension..."
jupyter server extension enable jupyterlab_mlflow.serverextension --sys-prefix || \
jupyter server extension enable jupyterlab_mlflow.serverextension
echo "✅ Server extension enabled"
echo ""

# Step 6: Verify installation
echo "🔍 Step 6: Verifying installation..."
jupyter server extension list | grep mlflow || echo "⚠️  Extension may not be listed (this is OK)"
jupyter labextension list | grep mlflow || echo "⚠️  Lab extension may not be listed (this is OK)"
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Set MLFLOW_TRACKING_URI environment variable (optional):"
echo "      export MLFLOW_TRACKING_URI=http://localhost:5000"
echo ""
echo "   2. Start JupyterLab:"
echo "      jupyter lab"
echo ""
echo "   3. The MLflow extension should appear in the left sidebar"
echo "   4. Configure the MLflow server URI in Settings → Advanced Settings Editor → MLflow"
echo ""

