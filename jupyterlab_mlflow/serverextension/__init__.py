"""
JupyterLab MLflow Server Extension
"""

import os
import logging
from .handlers import setup_handlers

logger = logging.getLogger(__name__)


def _jupyter_server_extension_points():
    """
    Returns a list of dictionaries with metadata about
    the server extension points.
    """
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
    try:
        setup_handlers(server_app.web_app)
        server_app.log.info("✅ Registered jupyterlab-mlflow server extension")
        logger.info("✅ Registered jupyterlab-mlflow server extension")
    except Exception as e:
        error_msg = f"❌ Failed to register jupyterlab-mlflow server extension: {e}"
        server_app.log.error(error_msg)
        logger.error(error_msg, exc_info=True)
        # Don't raise - allow JupyterLab to continue loading even if extension fails
        # This prevents the entire server from failing due to extension issues


# For Jupyter Server 2.x compatibility
def _jupyter_server_extension_paths():
    """
    Returns a list of server extension paths for Jupyter Server 2.x.
    """
    return [{
        "module": "jupyterlab_mlflow.serverextension"
    }]


# Try to auto-load if we're being imported in a Jupyter Server context
# This is a fallback for environments where entry points don't work
def _try_auto_load():
    """Attempt to auto-load the extension if we're in a Jupyter Server context"""
    try:
        # Check if we're in a Jupyter Server process
        import sys
        if 'jupyter_server' in sys.modules or 'jupyterlab' in sys.modules:
            # Try to get the current ServerApp instance
            try:
                from jupyter_server.serverapp import ServerApp
                # ServerApp might have a singleton or registry
                # This is a best-effort attempt
                pass
            except ImportError:
                pass
    except Exception:
        # Silently fail - entry point will handle loading
        pass

# Attempt auto-load (entry point should handle it, but this is a fallback)
_try_auto_load()

