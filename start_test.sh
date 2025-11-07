#!/bin/bash
# Start JupyterLab with MLflow extension for testing

export PYTHONPATH="$(pwd):$PYTHONPATH"

echo "🚀 Starting JupyterLab with MLflow extension..."
echo ""
echo "📝 Note: Make sure you have:"
echo "   1. An MLflow server running (optional, for testing)"
echo "   2. Or set MLFLOW_TRACKING_URI environment variable"
echo ""
echo "To start a local MLflow server:"
echo "   mlflow ui --port 5000"
echo ""
echo "Then set:"
echo "   export MLFLOW_TRACKING_URI=http://localhost:5000"
echo ""

# Start JupyterLab
python3 -m jupyter lab

