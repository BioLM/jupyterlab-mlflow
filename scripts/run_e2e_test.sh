#!/bin/bash
# End-to-end test script
# This script:
# 1. Publishes to TestPyPI (optional)
# 2. Spins up fresh JupyterLab in Docker
# 3. Installs extension from TestPyPI
# 4. Runs Playwright tests to verify functionality

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
E2E_TEST_DIR="$PROJECT_ROOT/e2e_test"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PUBLISH_TO_TESTPYPI="${PUBLISH_TO_TESTPYPI:-false}"
EXTENSION_VERSION="${EXTENSION_VERSION:-}"
USE_EXISTING_CONTAINER="${USE_EXISTING_CONTAINER:-false}"
HEADLESS="${HEADLESS:-true}"

echo -e "${BLUE}🧪 End-to-End Test Suite${NC}"
echo "=========================="
echo ""

# Step 1: Publish to TestPyPI (optional)
if [ "$PUBLISH_TO_TESTPYPI" = "true" ]; then
    echo -e "${YELLOW}📤 Step 1: Publishing to TestPyPI...${NC}"
    cd "$PROJECT_ROOT"
    bash scripts/publish_to_testpypi.sh
    if [ -z "$EXTENSION_VERSION" ]; then
        EXTENSION_VERSION=$(python -c "import json; print(json.load(open('package.json'))['version'])")
    fi
    echo -e "${GREEN}✅ Published version $EXTENSION_VERSION${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Step 1: Skipping TestPyPI publish (set PUBLISH_TO_TESTPYPI=true to enable)${NC}"
    if [ -z "$EXTENSION_VERSION" ]; then
        EXTENSION_VERSION=$(python -c "import json; print(json.load(open('package.json'))['version'])")
    fi
    echo -e "${BLUE}   Using version: $EXTENSION_VERSION${NC}"
    echo ""
fi

# Step 2: Create test directory structure
echo -e "${YELLOW}📁 Step 2: Setting up test directory...${NC}"
mkdir -p "$E2E_TEST_DIR/work" "$E2E_TEST_DIR/mlruns"
echo -e "${GREEN}✅ Test directory created${NC}"
echo ""

# Step 3: Stop existing containers
if [ "$USE_EXISTING_CONTAINER" != "true" ]; then
    echo -e "${YELLOW}🛑 Step 3: Stopping existing containers...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml down 2>/dev/null || true
    echo -e "${GREEN}✅ Containers stopped${NC}"
    echo ""
fi

# Step 4: Build and start Docker containers
if [ "$USE_EXISTING_CONTAINER" != "true" ]; then
    echo -e "${YELLOW}🐳 Step 4: Building and starting Docker containers...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml build
    docker-compose -f docker-compose.test.yml up -d
    echo -e "${GREEN}✅ Containers started${NC}"
    echo ""
    
    # Wait for JupyterLab to be ready
    echo -e "${YELLOW}⏳ Waiting for JupyterLab to be ready...${NC}"
    MAX_WAIT=30
    WAITED=0
    JUPYTERLAB_PORT=8889
    while ! curl -s -o /dev/null -w "%{http_code}" http://localhost:$JUPYTERLAB_PORT/lab | grep -qE "^(200|302)"; do
        if [ $WAITED -ge $MAX_WAIT ]; then
            echo -e "\n${RED}❌ Timeout waiting for JupyterLab (waited ${WAITED}s)${NC}"
            docker-compose -f docker-compose.test.yml logs jupyterlab | tail -20
            exit 1
        fi
        sleep 1
        WAITED=$((WAITED + 1))
        if [ $((WAITED % 5)) -eq 0 ]; then
            echo -n " [${WAITED}s]"
        else
            echo -n "."
        fi
    done
    echo ""
    echo -e "${GREEN}✅ JupyterLab is ready (took ${WAITED}s)${NC}"
    echo ""
    
    # Give it a bit more time to fully initialize
    echo "   Waiting 3s for full initialization..."
    sleep 3
fi

# Step 5: Install extension in Docker container
echo -e "${YELLOW}📦 Step 5: Installing extension from TestPyPI...${NC}"
INSTALL_CMD="pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ jupyterlab-mlflow==$EXTENSION_VERSION"
echo "   Running: $INSTALL_CMD"
echo "   (This may take 1-2 minutes to download dependencies...)"

if docker-compose -f docker-compose.test.yml exec -T jupyterlab bash -c "$INSTALL_CMD 2>&1 | tail -5"; then
    echo -e "${GREEN}✅ Extension installed${NC}"
else
    echo -e "${RED}❌ Failed to install extension${NC}"
    docker-compose -f docker-compose.test.yml logs jupyterlab | tail -20
    exit 1
fi
echo ""

# Step 6: Enable server extension
echo -e "${YELLOW}⚙️  Step 6: Enabling server extension...${NC}"
ENABLE_CMD="jupyter server extension enable jupyterlab_mlflow.serverextension"
if docker-compose -f docker-compose.test.yml exec -T jupyterlab bash -c "$ENABLE_CMD"; then
    echo -e "${GREEN}✅ Server extension enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Server extension enable failed (may already be enabled)${NC}"
fi
echo ""

# Step 7: Restart JupyterLab to load extension
echo -e "${YELLOW}🔄 Step 7: Restarting JupyterLab...${NC}"
docker-compose -f docker-compose.test.yml restart jupyterlab
echo "   Waiting 5s for container to restart..."
sleep 5

# Wait for JupyterLab to be ready again
echo -e "${YELLOW}⏳ Waiting for JupyterLab to restart...${NC}"
MAX_WAIT=30
WAITED=0
JUPYTERLAB_PORT=${JUPYTERLAB_PORT:-8889}
while ! curl -s -o /dev/null -w "%{http_code}" http://localhost:$JUPYTERLAB_PORT/lab | grep -qE "^(200|302)"; do
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo -e "\n${RED}❌ Timeout waiting for JupyterLab to restart (waited ${WAITED}s)${NC}"
        docker-compose -f docker-compose.test.yml logs jupyterlab | tail -20
        exit 1
    fi
    sleep 1
    WAITED=$((WAITED + 1))
    if [ $((WAITED % 5)) -eq 0 ]; then
        echo -n " [${WAITED}s]"
    else
        echo -n "."
    fi
done
echo ""
echo -e "${GREEN}✅ JupyterLab restarted (took ${WAITED}s)${NC}"
echo ""

# Step 8: Set JupyterLab URL (auth is disabled, no token needed)
echo -e "${YELLOW}🔑 Step 8: Setting JupyterLab URL...${NC}"
# Auth is disabled, so we can access /lab directly
JUPYTERLAB_URL="http://localhost:8889/lab"
echo "   URL: $JUPYTERLAB_URL (auth disabled)"
echo ""

# Step 9: Run Playwright tests
echo -e "${YELLOW}🎭 Step 9: Running Playwright tests...${NC}"
cd "$PROJECT_ROOT"

# Set environment variables for tests
export JUPYTERLAB_URL="$JUPYTERLAB_URL"
export EXTENSION_VERSION="$EXTENSION_VERSION"
export HEADLESS="$HEADLESS"

# Install Playwright if needed
if ! python -c "import playwright" 2>/dev/null; then
    echo "Installing Playwright..."
    pip install playwright pytest pytest-asyncio pytest-timeout
    playwright install chromium
fi

# Check if pytest-timeout is available
if ! python -c "import pytest_timeout" 2>/dev/null; then
    echo "Installing pytest-timeout for test timeouts..."
    pip install pytest-timeout
fi

# Run tests with progress output and timeout
echo "Running tests with Playwright..."
echo "  (Starting test run at $(date +%H:%M:%S))"
echo "  (Each test has 60s timeout, total suite timeout: 5 minutes)"
echo ""

# Run pytest with timeout and immediate output
echo "  Executing: pytest tests/e2e/test_extension_installation.py -v --tb=short --capture=no --timeout=30"
echo ""

# Run pytest with per-test timeout and fail-fast
# Each test gets 30s, if it hangs pytest-timeout will kill it
echo "  Running pytest with 30s per-test timeout..."
echo ""

pytest tests/e2e/test_extension_installation.py \
    -v \
    --tb=line \
    --capture=no \
    --timeout=30 \
    --timeout-method=thread \
    -x \
    2>&1 | tee /tmp/pytest_output.log

PYTEST_EXIT=$?
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pytest exit code: $PYTEST_EXIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for timeout in output
if grep -q "Timeout" /tmp/pytest_output.log 2>/dev/null; then
    echo -e "${RED}❌ Tests timed out${NC}"
    echo "Timeout detected in output. Last 30 lines:"
    tail -30 /tmp/pytest_output.log 2>/dev/null || echo "No output log found"
    TEST_RESULT=1
elif [ $PYTEST_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    TEST_RESULT=0
else
    echo -e "${RED}❌ Some tests failed (exit code: $PYTEST_EXIT)${NC}"
    echo "Last 30 lines of output:"
    tail -30 /tmp/pytest_output.log 2>/dev/null || echo "No output log found"
    TEST_RESULT=1
fi
echo ""

# Step 10: Show results
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}🎉 End-to-end tests completed successfully!${NC}"
    echo ""
    echo "JupyterLab is running at: http://localhost:8889/lab"
    echo "You can manually test by opening this URL in your browser"
    echo ""
    echo "To stop the containers, run:"
    echo "  docker-compose -f docker-compose.test.yml down"
else
    echo -e "${RED}❌ End-to-end tests failed${NC}"
    echo ""
    echo "Check the logs:"
    echo "  docker-compose -f docker-compose.test.yml logs jupyterlab"
    echo ""
    echo "Or inspect the container:"
    echo "  docker-compose -f docker-compose.test.yml exec jupyterlab bash"
fi

# Don't exit with error if we're keeping containers running
if [ "${KEEP_CONTAINERS:-false}" = "true" ]; then
    exit 0
else
    exit $TEST_RESULT
fi

