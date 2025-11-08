"""
JupyterLab MLflow Server Extension
"""

import os
import sys
import logging
from .handlers import setup_handlers

logger = logging.getLogger(__name__)

# Track if extension has been loaded to avoid duplicate registration
_extension_loaded = False


def _jupyter_server_extension_points():
    """
    Returns a list of dictionaries with metadata about
    the server extension points.
    """
    # Log to stderr for visibility in managed environments
    print("jupyterlab-mlflow: Extension points discovered", file=sys.stderr)
    return [{
        "module": "jupyterlab_mlflow.serverextension"
    }]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyter_server.serverapp.ServerApp
        Jupyter Server application instance
    """
    global _extension_loaded
    
    # Prevent duplicate registration
    if _extension_loaded:
        server_app.log.warning("jupyterlab-mlflow: Extension already loaded, skipping duplicate registration")
        return
    
    try:
        setup_handlers(server_app.web_app)
        _extension_loaded = True
        
        # Log success to both logger and stderr for visibility
        success_msg = "✅ Registered jupyterlab-mlflow server extension"
        server_app.log.info(success_msg)
        logger.info(success_msg)
        print(success_msg, file=sys.stderr)
        
        # Log startup verification details
        base_url = server_app.web_app.settings.get("base_url", "/")
        verification_msg = f"✅ jupyterlab-mlflow: Server extension loaded successfully with base_url: {base_url}"
        server_app.log.info(verification_msg)
        logger.info(verification_msg)
        print(verification_msg, file=sys.stderr)
        
    except Exception as e:
        error_msg = f"❌ Failed to register jupyterlab-mlflow server extension: {e}"
        server_app.log.error(error_msg)
        logger.error(error_msg, exc_info=True)
        # Also print to stderr for visibility in managed environments
        print(error_msg, file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        # Don't raise - allow JupyterLab to continue loading even if extension fails
        # This prevents the entire server from failing due to extension issues


# For Jupyter Server 2.x compatibility
def _jupyter_server_extension_paths():
    """
    Returns a list of server extension paths for Jupyter Server 2.x.
    """
    print("jupyterlab-mlflow: Extension paths discovered (Jupyter Server 2.x)", file=sys.stderr)
    return [{
        "module": "jupyterlab_mlflow.serverextension"
    }]


# Aggressive loading mechanism: Try to hook into ServerApp initialization
def _try_aggressive_load():
    """Try to register extension handlers if we detect Jupyter Server is running"""
    try:
        # Check if we're in a Jupyter Server process by looking for ServerApp in sys.modules
        if 'jupyter_server.serverapp' in sys.modules:
            try:
                from jupyter_server.serverapp import ServerApp
                # Try to get the singleton instance if it exists
                # This is a best-effort attempt - ServerApp may not be initialized yet
                if hasattr(ServerApp, '_instance') and ServerApp._instance is not None:
                    server_app = ServerApp._instance
                    if not _extension_loaded and hasattr(server_app, 'web_app'):
                        print("jupyterlab-mlflow: Attempting aggressive load via ServerApp singleton", file=sys.stderr)
                        _load_jupyter_server_extension(server_app)
            except (ImportError, AttributeError, TypeError):
                pass
    except Exception:
        # Silently fail - entry points should handle loading
        pass


# Register startup hook to ensure extension loads even if entry points fail
def _register_startup_hook():
    """Register a startup hook to ensure extension loads during server initialization"""
    try:
        # Try to hook into Jupyter Server's initialization
        # This is a best-effort attempt
        _try_aggressive_load()
    except Exception:
        # Silently fail - entry points and config files should handle loading
        pass


# Log module import for diagnostics
print("jupyterlab-mlflow: Server extension module imported", file=sys.stderr)

# Register startup hook (entry points should handle loading, but this is a fallback)
_register_startup_hook()

# Also try aggressive load after a short delay to catch ServerApp initialization
# This is a last resort if entry points and config files fail
try:
    import threading
    def delayed_load():
        import time
        time.sleep(0.5)  # Wait for ServerApp to initialize
        _try_aggressive_load()
    thread = threading.Thread(target=delayed_load, daemon=True)
    thread.start()
except Exception:
    pass

