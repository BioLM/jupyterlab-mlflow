"""
MLflow local server management
"""

import os
import subprocess
import threading
import time
from pathlib import Path
from typing import Optional, Dict, Any
import tempfile

# Global state for MLflow server process
_mlflow_process: Optional[subprocess.Popen] = None
_mlflow_port: int = 5000
_mlflow_tracking_uri: str = "sqlite:///mlflow.db"
_mlflow_artifact_uri: Optional[str] = None
_mlflow_backend_uri: Optional[str] = None


def start_mlflow_server(
    port: int = 5000,
    tracking_uri: str = "sqlite:///mlflow.db",
    artifact_uri: Optional[str] = None,
    backend_uri: Optional[str] = None
) -> Dict[str, Any]:
    """
    Start a local MLflow server.
    
    Parameters
    ----------
    port : int
        Port to run MLflow UI on (default: 5000)
    tracking_uri : str
        Tracking URI (default: sqlite:///mlflow.db)
    artifact_uri : str, optional
        Artifact URI (default: None, uses default)
    backend_uri : str, optional
        Backend store URI (default: None)
    
    Returns
    -------
    dict
        Status information including server URL and process info
    """
    global _mlflow_process, _mlflow_port, _mlflow_tracking_uri, _mlflow_artifact_uri, _mlflow_backend_uri
    
    if _mlflow_process is not None:
        # Check if process is still running
        if _mlflow_process.poll() is None:
            return {
                "success": True,
                "running": True,
                "port": _mlflow_port,
                "url": f"http://localhost:{_mlflow_port}",
                "message": "MLflow server is already running"
            }
        else:
            # Process died, clean up
            _mlflow_process = None
    
    # Prepare command
    cmd = ["mlflow", "ui", "--port", str(port), "--host", "127.0.0.1"]
    
    # Set tracking URI via environment variable
    env = os.environ.copy()
    env["MLFLOW_TRACKING_URI"] = tracking_uri
    
    # Set artifact URI if provided
    if artifact_uri:
        env["MLFLOW_ARTIFACT_ROOT"] = artifact_uri
    
    # Set backend URI if provided
    if backend_uri:
        env["MLFLOW_BACKEND_STORE_URI"] = backend_uri
    
    # Create artifact directory if it doesn't exist
    if artifact_uri:
        artifact_path = Path(artifact_uri)
        if not artifact_path.exists():
            artifact_path.mkdir(parents=True, exist_ok=True)
    
    try:
        # Start MLflow server
        _mlflow_process = subprocess.Popen(
            cmd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True
        )
        
        # Store configuration
        _mlflow_port = port
        _mlflow_tracking_uri = tracking_uri
        _mlflow_artifact_uri = artifact_uri
        _mlflow_backend_uri = backend_uri
        
        # Wait a bit to check if it started successfully
        time.sleep(2)
        
        if _mlflow_process.poll() is not None:
            # Process died immediately
            stdout, stderr = _mlflow_process.communicate()
            error_msg = stderr.decode('utf-8', errors='ignore') if stderr else "Unknown error"
            _mlflow_process = None
            return {
                "success": False,
                "running": False,
                "error": f"Failed to start MLflow server: {error_msg}"
            }
        
        return {
            "success": True,
            "running": True,
            "port": port,
            "url": f"http://localhost:{port}",
            "tracking_uri": tracking_uri,
            "artifact_uri": artifact_uri,
            "message": f"MLflow server started on http://localhost:{port}"
        }
    except Exception as e:
        return {
            "success": False,
            "running": False,
            "error": f"Failed to start MLflow server: {str(e)}"
        }


def stop_mlflow_server() -> Dict[str, Any]:
    """
    Stop the local MLflow server.
    
    Returns
    -------
    dict
        Status information
    """
    global _mlflow_process
    
    if _mlflow_process is None:
        return {
            "success": True,
            "running": False,
            "message": "MLflow server is not running"
        }
    
    try:
        # Terminate the process
        _mlflow_process.terminate()
        
        # Wait for it to terminate (with timeout)
        try:
            _mlflow_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            # Force kill if it doesn't terminate
            _mlflow_process.kill()
            _mlflow_process.wait()
        
        _mlflow_process = None
        
        return {
            "success": True,
            "running": False,
            "message": "MLflow server stopped"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to stop MLflow server: {str(e)}"
        }


def get_mlflow_server_status() -> Dict[str, Any]:
    """
    Get the status of the local MLflow server.
    
    Returns
    -------
    dict
        Status information
    """
    global _mlflow_process, _mlflow_port, _mlflow_tracking_uri, _mlflow_artifact_uri
    
    if _mlflow_process is None:
        return {
            "running": False,
            "port": None,
            "url": None,
            "tracking_uri": None,
            "artifact_uri": None
        }
    
    # Check if process is still running
    if _mlflow_process.poll() is not None:
        # Process died
        _mlflow_process = None
        return {
            "running": False,
            "port": None,
            "url": None,
            "tracking_uri": None,
            "artifact_uri": None,
            "message": "MLflow server process has stopped"
        }
    
    return {
        "running": True,
        "port": _mlflow_port,
        "url": f"http://localhost:{_mlflow_port}",
        "tracking_uri": _mlflow_tracking_uri,
        "artifact_uri": _mlflow_artifact_uri
    }

