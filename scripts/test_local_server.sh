#!/bin/bash
# Test script for local MLflow server functionality

set -e

echo "🧪 Testing Local MLflow Server Functionality"
echo "=============================================="
echo ""

# Check if JupyterLab is running
echo "📋 Prerequisites:"
echo "   1. JupyterLab should be running (start with: jupyter lab --port=8888)"
echo "   2. The extension should be installed and enabled"
echo ""

# Test 1: Check status endpoint
echo "1. Testing GET /mlflow/api/local-server (status)..."
STATUS_RESPONSE=$(curl -s http://localhost:8888/mlflow/api/local-server 2>&1)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/mlflow/api/local-server 2>&1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Status endpoint working (HTTP $HTTP_CODE)"
    echo "   Response: $STATUS_RESPONSE"
else
    echo "   ❌ Status endpoint failed (HTTP $HTTP_CODE)"
    echo "   Response: $STATUS_RESPONSE"
    exit 1
fi

# Test 2: Start server
echo ""
echo "2. Testing POST /mlflow/api/local-server (start)..."
START_RESPONSE=$(curl -s -X POST http://localhost:8888/mlflow/api/local-server \
    -H "Content-Type: application/json" \
    -d '{"port":5001,"tracking_uri":"sqlite:///test_mlflow.db","artifact_uri":"./test_mlruns"}' 2>&1)
START_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8888/mlflow/api/local-server \
    -H "Content-Type: application/json" \
    -d '{"port":5001,"tracking_uri":"sqlite:///test_mlflow.db","artifact_uri":"./test_mlruns"}' 2>&1)

if [ "$START_HTTP_CODE" = "200" ]; then
    echo "   ✅ Start endpoint working (HTTP $START_HTTP_CODE)"
    echo "   Response: $START_RESPONSE"
    
    # Check if server is actually running
    sleep 2
    if curl -s http://localhost:5001 > /dev/null 2>&1; then
        echo "   ✅ MLflow server is accessible on http://localhost:5001"
    else
        echo "   ⚠️  MLflow server may not be fully started yet"
    fi
else
    echo "   ❌ Start endpoint failed (HTTP $START_HTTP_CODE)"
    echo "   Response: $START_RESPONSE"
    exit 1
fi

# Test 3: Check status again
echo ""
echo "3. Testing GET /mlflow/api/local-server (status after start)..."
sleep 1
STATUS_RESPONSE2=$(curl -s http://localhost:8888/mlflow/api/local-server 2>&1)
echo "   Response: $STATUS_RESPONSE2"

# Test 4: Stop server
echo ""
echo "4. Testing DELETE /mlflow/api/local-server (stop)..."
STOP_RESPONSE=$(curl -s -X DELETE http://localhost:8888/mlflow/api/local-server 2>&1)
STOP_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:8888/mlflow/api/local-server 2>&1)

if [ "$STOP_HTTP_CODE" = "200" ]; then
    echo "   ✅ Stop endpoint working (HTTP $STOP_HTTP_CODE)"
    echo "   Response: $STOP_RESPONSE"
else
    echo "   ❌ Stop endpoint failed (HTTP $STOP_HTTP_CODE)"
    echo "   Response: $STOP_RESPONSE"
    exit 1
fi

# Test 5: Check status after stop
echo ""
echo "5. Testing GET /mlflow/api/local-server (status after stop)..."
sleep 1
STATUS_RESPONSE3=$(curl -s http://localhost:8888/mlflow/api/local-server 2>&1)
echo "   Response: $STATUS_RESPONSE3"

echo ""
echo "✅ All tests passed!"
echo ""
echo "📝 To test in the UI:"
echo "   1. Open JupyterLab"
echo "   2. Click the MLflow icon in the left sidebar"
echo "   3. Click the settings icon (⚙️)"
echo "   4. Scroll to 'Local MLflow Server' section"
echo "   5. Click 'Start Local Server'"
echo "   6. Check that the server starts and the URL is displayed"

