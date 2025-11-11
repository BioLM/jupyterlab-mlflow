"""
JupyterLab MLflow Server Extension
"""

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
        
        # Log success
        success_msg = "✅ Registered jupyterlab-mlflow server extension"
        server_app.log.info(success_msg)
        logger.info(success_msg)
        
        # Log startup verification details
        base_url = server_app.web_app.settings.get("base_url", "/")
        verification_msg = f"✅ jupyterlab-mlflow: Server extension loaded successfully with base_url: {base_url}"
        server_app.log.info(verification_msg)
        logger.info(verification_msg)
        
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
