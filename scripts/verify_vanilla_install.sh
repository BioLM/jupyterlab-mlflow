#!/bin/bash
# Verify extension installation in a vanilla JupyterLab Docker container

set -e

# Configuration
EXTENSION_VERSION=${EXTENSION_VERSION:-"0.3.0"}
CONTAINER_NAME="jupyterlab-mlflow-vanilla-test"
PORT=${PORT:-8888}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Verifying Extension Installation in Vanilla JupyterLab${NC}"
echo "=================================================="
echo ""

# Step 1: Stop and remove existing container if it exists
echo -e "${YELLOW}🧹 Step 1: Cleaning up existing container...${NC}"
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true
echo -e "${GREEN}✅ Cleaned up${NC}"
echo ""

# Step 2: Start vanilla JupyterLab container
echo -e "${YELLOW}🐳 Step 2: Starting vanilla JupyterLab container...${NC}"
docker run -d \
    --name "$CONTAINER_NAME" \
    -p "$PORT:8888" \
    -e JUPYTER_ENABLE_LAB=yes \
    jupyter/scipy-notebook:latest \
    bash -c "jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root --ServerApp.token='' --ServerApp.password='' --IdentityProvider.token=''"

echo "   Waiting for JupyterLab to start..."
sleep 10

# Wait for JupyterLab to be ready
MAX_WAIT=30
WAITED=0
while ! curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/lab | grep -qE "^(200|302)"; do
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo -e "\n${RED}❌ Timeout waiting for JupyterLab (waited ${WAITED}s)${NC}"
        docker logs "$CONTAINER_NAME" | tail -20
        exit 1
    fi
    sleep 1
    WAITED=$((WAITED + 1))
    echo -n "."
done
echo ""
echo -e "${GREEN}✅ JupyterLab is ready (took ${WAITED}s)${NC}"
echo ""

# Step 3: Install extension
echo -e "${YELLOW}📦 Step 3: Installing extension from TestPyPI...${NC}"
INSTALL_CMD="pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ jupyterlab-mlflow==$EXTENSION_VERSION"
echo "   Running: $INSTALL_CMD"

if docker exec "$CONTAINER_NAME" bash -c "$INSTALL_CMD"; then
    echo -e "${GREEN}✅ Extension installed${NC}"
else
    echo -e "${RED}❌ Failed to install extension${NC}"
    docker logs "$CONTAINER_NAME" | tail -20
    exit 1
fi
echo ""

# Step 4: Enable server extension
echo -e "${YELLOW}⚙️  Step 4: Enabling server extension...${NC}"
if docker exec "$CONTAINER_NAME" bash -c "jupyter server extension enable jupyterlab_mlflow.serverextension"; then
    echo -e "${GREEN}✅ Server extension enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Server extension enable failed (may already be enabled)${NC}"
fi
echo ""

# Step 5: Restart JupyterLab
echo -e "${YELLOW}🔄 Step 5: Restarting JupyterLab...${NC}"
docker restart "$CONTAINER_NAME"
echo "   Waiting 10s for restart..."
sleep 10

# Wait for JupyterLab to be ready again
WAITED=0
while ! curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/lab | grep -qE "^(200|302)"; do
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo -e "\n${RED}❌ Timeout waiting for JupyterLab to restart (waited ${WAITED}s)${NC}"
        docker logs "$CONTAINER_NAME" | tail -20
        exit 1
    fi
    sleep 1
    WAITED=$((WAITED + 1))
    echo -n "."
done
echo ""
echo -e "${GREEN}✅ JupyterLab restarted (took ${WAITED}s)${NC}"
echo ""

# Step 6: Verify installation
echo -e "${YELLOW}✅ Step 6: Verifying installation...${NC}"

# Check labextension
echo "   Checking labextension..."
LABEXT_OUTPUT=$(docker exec "$CONTAINER_NAME" bash -c "jupyter labextension list" 2>&1)
if echo "$LABEXT_OUTPUT" | grep -q "jupyterlab-mlflow.*OK"; then
    echo -e "   ${GREEN}✅ Labextension installed and enabled${NC}"
else
    echo -e "   ${YELLOW}⚠️  Labextension status:${NC}"
    echo "$LABEXT_OUTPUT" | grep -i mlflow || echo "   (not found in output)"
fi

# Check server extension
echo "   Checking server extension..."
SERVER_EXT_OUTPUT=$(docker exec "$CONTAINER_NAME" bash -c "jupyter server extension list" 2>&1)
if echo "$SERVER_EXT_OUTPUT" | grep -q "jupyterlab_mlflow.serverextension.*OK"; then
    echo -e "   ${GREEN}✅ Server extension enabled${NC}"
else
    echo -e "   ${YELLOW}⚠️  Server extension status:${NC}"
    echo "$SERVER_EXT_OUTPUT" | grep -i mlflow || echo "   (not found in output)"
fi

# Check if extension appears in JupyterLab config
echo "   Checking JupyterLab config..."
CONFIG_CHECK=$(docker exec "$CONTAINER_NAME" bash -c "curl -s http://localhost:8888/lab 2>&1 | grep -o 'jupyterlab-mlflow' | head -1" || echo "")
if [ -n "$CONFIG_CHECK" ]; then
    echo -e "   ${GREEN}✅ Extension found in JupyterLab config${NC}"
else
    echo -e "   ${YELLOW}⚠️  Extension not found in config (may need rebuild)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Verification complete!${NC}"
echo ""
echo "JupyterLab is running at: http://localhost:$PORT/lab"
echo ""
echo "To stop the container, run:"
echo "  docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
echo ""
echo "To view logs, run:"
echo "  docker logs $CONTAINER_NAME"
echo ""

