# Testing the JupyterLab MLflow Extension Locally

## Quick Start

Run the automated test script:

```bash
./test_local.sh
```

Or follow the manual steps below.

## Manual Testing Steps

### 1. Install Python Dependencies

```bash
pip install -e .
```

This installs:
- JupyterLab
- MLflow
- The extension package

### 2. Install Node Dependencies

```bash
jlpm install
```

### 3. Build the Extension

```bash
# Build TypeScript
jlpm build:lib

# Build JupyterLab extension
jlpm build:labextension:dev
```

### 4. Enable Server Extension

```bash
jupyter server extension enable jupyterlab_mlflow.serverextension
```

### 5. Verify Installation

```bash
# Check server extension
jupyter server extension list

# Check lab extension
jupyter labextension list
```

### 6. Start JupyterLab

```bash
jupyter lab
```

## Configuration

### Option 1: Environment Variable

```bash
export MLFLOW_TRACKING_URI=http://localhost:5000
jupyter lab
```

### Option 2: Settings UI

1. Open JupyterLab
2. Go to Settings → Advanced Settings Editor
3. Select "MLflow" from the left sidebar
4. Enter your MLflow tracking URI
5. Click "Save"

## Testing the Extension

1. **Check Sidebar**: The MLflow widget should appear in the left sidebar
2. **Browse Experiments**: Click on the "Experiments" tab to see your experiments
3. **Browse Models**: Click on the "Models" tab to see registered models
4. **View Artifacts**: Click on artifacts in the tree view to open them
5. **Copy IDs**: Right-click on experiments/runs/models to copy their IDs
6. **Test Connection**: Use the settings panel (⚙️ button) to test your MLflow connection

## Troubleshooting

### Extension Not Appearing

1. Check browser console for errors (F12)
2. Verify the extension is built: `ls -la jupyterlab_mlflow/labextension/`
3. Rebuild: `jlpm clean:all && jlpm build`

### Server Extension Not Loading

1. Check server logs when starting JupyterLab
2. Verify extension is enabled: `jupyter server extension list`
3. Try: `jupyter server extension enable jupyterlab_mlflow.serverextension --sys-prefix`

### Connection Errors

1. Verify MLflow server is running: `curl http://localhost:5000/health`
2. Check MLFLOW_TRACKING_URI is set correctly
3. Test connection in the settings panel

### Build Errors

1. Make sure you have Node.js and npm installed: `node --version && npm --version`
2. Make sure you have JupyterLab 4.0+: `jupyter lab --version`
3. Clean and rebuild: `jlpm clean:all && jlpm install && jlpm build`

## Development Mode

For development with auto-reload:

```bash
# Terminal 1: Watch for changes
jlpm watch

# Terminal 2: Start JupyterLab
jupyter lab --watch
```

## Testing with a Local MLflow Server

If you don't have an MLflow server running, you can start one:

```bash
# Start MLflow UI (defaults to http://localhost:5000)
mlflow ui

# Or with custom port
mlflow ui --port 5001
```

Then set `MLFLOW_TRACKING_URI=http://localhost:5000` (or your port).

