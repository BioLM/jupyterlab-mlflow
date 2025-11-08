"""
JupyterLab MLflow Server Extension
"""

import os
from .handlers import setup_handlers


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
    setup_handlers(server_app.web_app)
    server_app.log.info("Registered jupyterlab-mlflow server extension")


# For Jupyter Server 2.x compatibility
def _jupyter_server_extension_paths():
    """
    Returns a list of server extension paths for Jupyter Server 2.x.
    """
    return [{
        "module": "jupyterlab_mlflow.serverextension"
    }]

