#!/bin/bash
# Publish extension to TestPyPI for end-to-end testing
# This script builds and publishes the extension to TestPyPI

set -e

echo "🚀 Publishing to TestPyPI"
echo "========================="
echo ""

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: pyproject.toml not found. Run this script from the project root."
    exit 1
fi

# Check if TestPyPI credentials are set
if [ -z "$TESTPYPI_TOKEN" ]; then
    echo "⚠️  Warning: TESTPYPI_TOKEN not set. You may need to set it for publishing."
    echo "   You can get a token from: https://test.pypi.org/manage/account/token/"
    echo ""
fi

# Step 1: Clean previous builds
echo "🧹 Step 1: Cleaning previous builds..."
npm run clean:lib
npm run clean:labextension
rm -rf dist/ build/ *.egg-info
echo "✅ Cleaned"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
if ! command -v jlpm &> /dev/null; then
    npm install -g yarn
    alias jlpm=yarn
fi

npm ci
echo "✅ Dependencies installed"
echo ""

# Step 3: Build TypeScript
echo "🔨 Step 3: Building TypeScript..."
npm run build:lib
echo "✅ TypeScript built"
echo ""

# Step 4: Build JupyterLab extension
echo "🔨 Step 4: Building JupyterLab extension..."
python -m pip install --upgrade pip
pip install "jupyterlab>=4.0.0,<5"
python -m jupyter labextension build .
echo "✅ Extension built"
echo ""

# Step 5: Install build tools
echo "📦 Step 5: Installing build tools..."
pip install build hatchling hatch-nodejs-version twine
echo "✅ Build tools installed"
echo ""

# Step 6: Build Python package
echo "🔨 Step 6: Building Python package..."
python -m build
echo "✅ Package built"
echo ""

# Step 7: Publish to TestPyPI
echo "📤 Step 7: Publishing to TestPyPI..."
if [ -n "$TESTPYPI_TOKEN" ]; then
    python -m twine upload \
        --repository-url https://test.pypi.org/legacy/ \
        --username __token__ \
        --password "$TESTPYPI_TOKEN" \
        dist/*
    echo "✅ Published to TestPyPI"
elif [ -f ~/.pypirc ]; then
    echo "   Using credentials from ~/.pypirc"
    python -m twine upload --repository testpypi dist/*
    echo "✅ Published to TestPyPI"
else
    echo "⚠️  Skipping upload (TESTPYPI_TOKEN not set and ~/.pypirc not found)"
    echo "   Package built successfully but not uploaded."
    echo "   To publish manually, run:"
    echo "   python -m twine upload --repository testpypi dist/*"
    echo ""
    echo "   Or set TESTPYPI_TOKEN environment variable and re-run."
    echo "   For testing, you can use an existing version from TestPyPI."
fi
echo ""

# Step 8: Show installation command
VERSION=$(python -c "import json; print(json.load(open('package.json'))['version'])")
echo "✅ Build complete!"
echo ""
echo "📦 To install from TestPyPI, run:"
echo "   pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ jupyterlab-mlflow==$VERSION"
echo ""
echo "   Or use the e2e test script:"
echo "   ./scripts/run_e2e_test.sh"
echo ""

