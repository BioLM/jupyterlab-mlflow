# Quick Start - Testing the MLflow Extension

## Start JupyterLab

Run this command in your terminal:

```bash
export PYTHONPATH=/Users/astewart/git/jupyterlab-mlflow:$PYTHONPATH
python3 -m jupyterlab
```

Or use the provided script:

```bash
./start_test.sh
```

## What to Look For

1. **JupyterLab should start** and open in your browser (usually at http://localhost:8888)

2. **Check the left sidebar** - you should see a "MLflow" tab/icon

3. **Click on the MLflow tab** to open the extension

4. **Configure MLflow connection**:
   - Click the settings icon (⚙️) in the MLflow panel
   - Enter your MLflow tracking URI (e.g., `http://localhost:5000`)
   - Click "Test Connection" to verify
   - Click "Save"

## Testing with a Local MLflow Server

If you want to test with a local MLflow server, open a second terminal:

```bash
# Start MLflow UI
mlflow ui --port 5000
```

Then in the JupyterLab MLflow extension settings, enter:
```
http://localhost:5000
```

## Troubleshooting

### Extension doesn't appear
- Check browser console (F12) for errors
- Verify the extension files exist: `ls -la jupyterlab_mlflow/labextension/`
- Check JupyterLab logs for errors

### Server extension not loading
- The extension should auto-load via config files
- Check if there are any import errors in the terminal where JupyterLab is running

### Connection errors
- Verify MLflow server is running: `curl http://localhost:5000/health`
- Check the tracking URI is correct
- Try the "Test Connection" button in settings

## Next Steps

Once the extension is working:
1. Browse experiments in the tree or list view
2. Click on runs to see their details
3. Click on artifacts to view them
4. Right-click on items to copy IDs to clipboard

