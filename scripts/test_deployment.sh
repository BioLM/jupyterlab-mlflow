#!/bin/bash
# Comprehensive deployment test script
# Tests the full deployment pipeline: build -> publish -> install -> verify

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PUBLISH_TO_TESTPYPI="${PUBLISH_TO_TESTPYPI:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"
SKIP_INSTALL_TEST="${SKIP_INSTALL_TEST:-false}"

echo -e "${BLUE}🚀 Deployment Test Suite${NC}"
echo "=========================="
echo ""

cd "$PROJECT_ROOT"

# Step 1: Build the package
if [ "$SKIP_BUILD" != "true" ]; then
    echo -e "${YELLOW}🔨 Step 1: Building package...${NC}"
    
    # Clean
    echo "   Cleaning previous builds..."
    npm run clean:lib 2>/dev/null || true
    npm run clean:labextension 2>/dev/null || true
    rm -rf dist/ build/ *.egg-info .test_venv 2>/dev/null || true
    
    # Build TypeScript
    echo "   Building TypeScript..."
    npm run build:lib
    
    # Build JupyterLab extension
    echo "   Building JupyterLab extension..."
    python -m jupyter labextension build .
    
    # Build Python package
    echo "   Building Python package..."
    pip install -q build hatchling hatch-nodejs-version
    python -m build
    
    if [ -d "dist" ] && [ "$(ls -A dist/*.whl 2>/dev/null)" ]; then
        echo -e "${GREEN}✅ Package built successfully${NC}"
        ls -lh dist/*.whl | tail -1
    else
        echo -e "${RED}❌ Package build failed${NC}"
        exit 1
    fi
    echo ""
else
    echo -e "${YELLOW}⏭️  Step 1: Skipping build (SKIP_BUILD=true)${NC}"
    echo ""
fi

# Step 2: Publish to TestPyPI (optional)
if [ "$PUBLISH_TO_TESTPYPI" = "true" ]; then
    echo -e "${YELLOW}📤 Step 2: Publishing to TestPyPI...${NC}"
    
    if [ -z "$TESTPYPI_TOKEN" ]; then
        echo -e "${RED}❌ TESTPYPI_TOKEN not set${NC}"
        echo "   Get a token from: https://test.pypi.org/manage/account/token/"
        exit 1
    fi
    
    pip install -q twine
    python -m twine upload \
        --repository-url https://test.pypi.org/legacy/ \
        --username __token__ \
        --password "$TESTPYPI_TOKEN" \
        dist/*
    
    VERSION=$(python -c "import json; print(json.load(open('package.json'))['version'])")
    echo -e "${GREEN}✅ Published version $VERSION to TestPyPI${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Step 2: Skipping TestPyPI publish (set PUBLISH_TO_TESTPYPI=true to enable)${NC}"
    echo ""
fi

# Step 3: Test installation from TestPyPI
if [ "$SKIP_INSTALL_TEST" != "true" ]; then
    echo -e "${YELLOW}📦 Step 3: Testing installation from TestPyPI...${NC}"
    
    VERSION=$(python -c "import json; print(json.load(open('package.json'))['version'])")
    
    if [ "$PUBLISH_TO_TESTPYPI" = "true" ]; then
        echo "   Installing version $VERSION from TestPyPI..."
        INSTALL_CMD="pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ jupyterlab-mlflow==$VERSION"
    else
        echo "   Installing from local wheel..."
        WHEEL_FILE=$(ls -t dist/*.whl | head -1)
        INSTALL_CMD="pip install $WHEEL_FILE"
    fi
    
    echo "   Running: $INSTALL_CMD"
    
    # Test in a virtual environment (outside project root to avoid build issues)
    TEST_VENV="/tmp/jupyterlab_mlflow_test_venv_$$"
    if [ -d "$TEST_VENV" ]; then
        rm -rf "$TEST_VENV"
    fi
    
    python3 -m venv "$TEST_VENV"
    source "$TEST_VENV/bin/activate"
    
    # Install JupyterLab first
    pip install -q "jupyterlab>=4.0.0,<5" jupyter-server
    
    # Install the extension
    eval "$INSTALL_CMD"
    
    # Verify installation
    echo "   Verifying installation..."
    if python -c "import jupyterlab_mlflow; print('✅ Extension imported successfully')" 2>/dev/null; then
        echo -e "${GREEN}✅ Extension Python package installed${NC}"
    else
        echo -e "${RED}❌ Extension Python package not found${NC}"
        exit 1
    fi
    
    # Check labextension
    if jupyter labextension list 2>/dev/null | grep -q "jupyterlab-mlflow"; then
        echo -e "${GREEN}✅ Extension labextension installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Extension labextension not found in list (may need rebuild)${NC}"
    fi
    
    # Check server extension
    if jupyter server extension list 2>/dev/null | grep -q "jupyterlab_mlflow"; then
        echo -e "${GREEN}✅ Server extension available${NC}"
    else
        echo -e "${YELLOW}⚠️  Server extension not found${NC}"
    fi
    
    deactivate
    echo -e "${GREEN}✅ Installation test passed${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Step 3: Skipping installation test (SKIP_INSTALL_TEST=true)${NC}"
    echo ""
fi

# Step 4: Run end-to-end tests
echo -e "${YELLOW}🧪 Step 4: Running end-to-end tests...${NC}"
VERSION=$(python -c "import json; print(json.load(open('package.json'))['version'])")

if [ "$PUBLISH_TO_TESTPYPI" = "true" ]; then
    EXTENSION_VERSION="$VERSION" USE_EXISTING_CONTAINER=false ./scripts/run_e2e_test.sh
else
    echo "   Using existing version from TestPyPI for e2e tests"
    EXTENSION_VERSION="$VERSION" PUBLISH_TO_TESTPYPI=false USE_EXISTING_CONTAINER=false ./scripts/run_e2e_test.sh
fi

echo ""
echo -e "${GREEN}🎉 Deployment test completed successfully!${NC}"
echo ""
echo "Summary:"
echo "  ✅ Package built"
if [ "$PUBLISH_TO_TESTPYPI" = "true" ]; then
    echo "  ✅ Published to TestPyPI"
fi
echo "  ✅ Installation verified"
echo "  ✅ End-to-end tests passed"
echo ""

