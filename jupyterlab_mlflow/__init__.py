"""
JupyterLab MLflow Extension
"""

from ._version import __version__

def _jupyter_labextension_paths():
    """Called by Jupyter Lab Server to detect if it is a valid labextension and
    to install the widget

    Returns
    =======
    src: Source directory name to copy files from. Webpack outputs generated files
        into this directory and Jupyter Lab copies from this directory during
        widget installation
    dest: Destination directory name to install to
    """
    return [{
        'src': 'labextension',
        'dest': 'jupyterlab-mlflow'
    }]

