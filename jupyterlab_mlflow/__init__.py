"""
JupyterLab MLflow Extension
"""

import subprocess
import sys
import os

from ._version import __version__

# Auto-enable server extension on import (if not already enabled)
def _auto_enable_server_extension():
    """Attempt to auto-enable the server extension"""
    try:
        # Check if already enabled by trying to import the config
        from jupyter_server.services.config.manager import ConfigManager
        cm = ConfigManager()
        
        # Try to enable the extension
        result = subprocess.run(
            [sys.executable, "-m", "jupyter", "server", "extension", "enable",
             "jupyterlab_mlflow.serverextension", "--sys-prefix"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode != 0:
            # Try without --sys-prefix
            subprocess.run(
                [sys.executable, "-m", "jupyter", "server", "extension", "enable",
                 "jupyterlab_mlflow.serverextension"],
                capture_output=True,
                text=True,
                timeout=5
            )
    except Exception:
        # Silently fail - don't break installation if this doesn't work
        pass

# Only auto-enable if we're being imported in a Jupyter context
# (not during build/installation)
if not os.environ.get('JUPYTERLAB_MLFLOW_SKIP_AUTO_ENABLE'):
    try:
        _auto_enable_server_extension()
    except Exception:
        pass

def _jupyter_labextension_paths():
    """Called by Jupyter Lab Server to detect if it is a valid labextension and
    to install the widget

    Returns
    =======
    src: Source directory name to copy files from. The JupyterLab builder outputs
        generated files into this directory and Jupyter Lab copies from this
        directory during widget installation
    dest: Destination directory name to install to
    """
    return [{
        'src': 'labextension',
        'dest': 'jupyterlab-mlflow'
    }]

