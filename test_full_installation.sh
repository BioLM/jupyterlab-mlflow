#!/bin/bash
# Full end-to-end test of the installed package

set -e

echo "🧪 Full Installation Test"
echo "=========================="
echo ""

# Build fresh wheel
echo "📦 Step 1: Building fresh wheel..."
rm -rf dist/
python -m build --wheel 2>&1 | tail -5
WHEEL=$(ls dist/*.whl)
echo "✅ Built: $WHEEL"
echo ""

# Create test environment
echo "📦 Step 2: Creating test environment..."
TEST_DIR=$(mktemp -d)
echo "Test directory: $TEST_DIR"
cd "$TEST_DIR"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install jupyterlab -q
echo "✅ Test environment created"
echo ""

# Install the wheel
echo "📦 Step 3: Installing wheel..."
pip install "$OLDPWD/$WHEEL" -q
echo "✅ Package installed"
echo ""

# Check if config files were installed
echo "🔍 Step 4: Checking config files..."
CONFIG_DIRS=(
    "venv/etc/jupyter/jupyter_lab_config.d"
    "venv/etc/jupyter/jupyter_notebook_config.d"
)
for dir in "${CONFIG_DIRS[@]}"; do
    if [ -f "$dir/jupyterlab-mlflow.json" ]; then
        echo "✅ Found: $dir/jupyterlab-mlflow.json"
        cat "$dir/jupyterlab-mlflow.json"
    else
        echo "❌ MISSING: $dir/jupyterlab-mlflow.json"
    fi
done
echo ""

# Check entry points
echo "🔍 Step 5: Checking entry points..."
python -c "
import sys
try:
    from importlib.metadata import entry_points
    try:
        eps = entry_points(group='jupyter_server.server_extensions')
    except TypeError:
        eps = entry_points().get('jupyter_server.server_extensions', [])
except ImportError:
    import pkg_resources
    eps = pkg_resources.iter_entry_points('jupyter_server.server_extensions')

mlflow_eps = [ep for ep in eps if 'mlflow' in ep.name]
if mlflow_eps:
    ep = mlflow_eps[0]
    print(f'✅ Found entry point: {ep.name}')
    print(f'   Module: {ep.module}')
    print(f'   Attr: {ep.attr if hasattr(ep, \"attr\") else \"_load_jupyter_server_extension\"}')
else:
    print('❌ NO ENTRY POINT FOUND')
    sys.exit(1)
"
echo ""

# Test import
echo "🔍 Step 6: Testing module import..."
python -c "
try:
    from jupyterlab_mlflow.serverextension import _load_jupyter_server_extension
    print('✅ Module imports successfully')
except Exception as e:
    print(f'❌ Import failed: {e}')
    import traceback
    traceback.print_exc()
    exit(1)
"
echo ""

# Start JupyterLab and test
echo "🚀 Step 7: Starting JupyterLab server..."
jupyter lab --version
jupyter lab --no-browser --port=8889 > /tmp/jupyter_test.log 2>&1 &
JUPYTER_PID=$!
sleep 5

# Test API endpoint
echo "🔍 Step 8: Testing API endpoint..."
sleep 3
RESPONSE=$(curl -s http://localhost:8889/mlflow/api/local-server 2>&1)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8889/mlflow/api/local-server 2>&1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API endpoint working! (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE"
    if echo "$RESPONSE" | grep -q "running"; then
        echo "✅ Response contains expected JSON data"
    fi
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ API endpoint NOT FOUND (HTTP 404)"
    echo "   Server extension is NOT loading!"
    echo ""
    echo "Server logs:"
    tail -20 /tmp/jupyter_test.log | grep -i "mlflow\|error\|extension" || cat /tmp/jupyter_test.log
    kill $JUPYTER_PID 2>/dev/null || true
    exit 1
else
    echo "⚠️  Unexpected response (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi

# Cleanup
kill $JUPYTER_PID 2>/dev/null || true
cd "$OLDPWD"
rm -rf "$TEST_DIR"

echo ""
echo "✅ Full test PASSED!"

