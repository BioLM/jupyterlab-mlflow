#!/bin/bash
# Test API endpoints directly (requires JupyterLab to be running)
# Usage: ./test_api_endpoints.sh [jupyter_url] [mlflow_tracking_uri]

JUPYTER_URL="${1:-http://localhost:8888}"
MLFLOW_URI="${2:-http://localhost:5000}"

echo "🧪 Testing MLflow Extension API Endpoints"
echo "=========================================="
echo ""
echo "JupyterLab URL: $JUPYTER_URL"
echo "MLflow Tracking URI: $MLFLOW_URI"
echo ""

# Test connection endpoint
echo "1. Testing connection endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$JUPYTER_URL/mlflow/api/connection/test?tracking_uri=$(echo $MLFLOW_URI | jq -sRr @uri)")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Connection endpoint working (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Connection endpoint not found (HTTP 404)"
    echo "   This means the server extension is not loaded!"
    echo "   Check: jupyter server extension list"
else
    echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test local server status endpoint
echo "2. Testing local server status endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$JUPYTER_URL/mlflow/api/local-server")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Local server endpoint working (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Local server endpoint not found (HTTP 404)"
    echo "   This means the server extension is not loaded!"
else
    echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test experiments endpoint
echo "3. Testing experiments endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$JUPYTER_URL/mlflow/api/experiments?tracking_uri=$(echo $MLFLOW_URI | jq -sRr @uri)")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Experiments endpoint working (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Experiments endpoint not found (HTTP 404)"
else
    echo "   ⚠️  Response (HTTP $HTTP_CODE) - may be expected if MLflow server is not accessible"
fi
echo ""

echo "📝 Summary:"
echo "   - If you see 404 errors, the server extension is not loaded"
echo "   - Check JupyterLab logs for 'Registered jupyterlab-mlflow API handlers'"
echo "   - Verify: jupyter server extension list | grep mlflow"
echo ""

