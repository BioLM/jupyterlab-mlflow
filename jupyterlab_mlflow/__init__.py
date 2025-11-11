"""
JupyterLab MLflow Extension
"""

from ._version import __version__

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


# Also expose server extension functions at package level for compatibility
def _jupyter_server_extension_points():
    """Server extension points - also exposed here for compatibility"""
    from .serverextension import _jupyter_server_extension_points as _points
    return _points()


def _load_jupyter_server_extension(server_app):
    """Load server extension - also exposed here for compatibility"""
    from .serverextension import _load_jupyter_server_extension as _load
    return _load(server_app)

