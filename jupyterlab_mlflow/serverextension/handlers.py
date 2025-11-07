"""
MLflow API handlers for JupyterLab extension
"""

import json
import os
from typing import Dict, Any, Optional
from urllib.parse import urlparse

import mlflow
from mlflow.tracking import MlflowClient
from mlflow.exceptions import MlflowException
from tornado import web
from tornado.web import RequestHandler
from .mlflow_server import start_mlflow_server, stop_mlflow_server, get_mlflow_server_status


def get_mlflow_client(tracking_uri: Optional[str] = None) -> MlflowClient:
    """
    Get MLflow client with tracking URI from settings or environment.
    
    Parameters
    ----------
    tracking_uri : str, optional
        MLflow tracking URI. If None, uses environment variable or default.
    
    Returns
    -------
    MlflowClient
        Configured MLflow client
    """
    if tracking_uri:
        mlflow.set_tracking_uri(tracking_uri)
    elif os.environ.get("MLFLOW_TRACKING_URI"):
        mlflow.set_tracking_uri(os.environ["MLFLOW_TRACKING_URI"])
    
    return MlflowClient()


class MLflowBaseHandler(RequestHandler):
    """Base handler for MLflow API endpoints"""
    
    def set_default_headers(self):
        """Set CORS headers"""
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")
        self.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    
    def options(self):
        """Handle OPTIONS request for CORS"""
        self.set_status(204)
        self.finish()
    
    def get_tracking_uri(self) -> Optional[str]:
        """Get tracking URI from request or settings"""
        tracking_uri = self.get_query_argument("tracking_uri", None)
        if tracking_uri:
            return tracking_uri
        
        # Try to get from request body for POST requests
        if self.request.method == "POST":
            try:
                body = json.loads(self.request.body.decode("utf-8"))
                return body.get("tracking_uri")
            except (json.JSONDecodeError, KeyError):
                pass
        
        return None
    
    def write_error(self, status_code: int, **kwargs):
        """Write error response"""
        exc_info = kwargs.get("exc_info")
        if exc_info:
            exception = exc_info[1]
            if isinstance(exception, MlflowException):
                self.write({
                    "error": str(exception),
                    "status_code": status_code
                })
                return
        
        self.write({
            "error": f"HTTP {status_code}: {self._reason}",
            "status_code": status_code
        })


class ExperimentsHandler(MLflowBaseHandler):
    """Handler for listing experiments"""
    
    def get(self):
        """Get list of experiments"""
        try:
            tracking_uri = self.get_tracking_uri()
            client = get_mlflow_client(tracking_uri)
            
            experiments = client.search_experiments()
            experiments_data = []
            
            for exp in experiments:
                experiments_data.append({
                    "experiment_id": exp.experiment_id,
                    "name": exp.name,
                    "artifact_location": exp.artifact_location,
                    "lifecycle_stage": exp.lifecycle_stage,
                    "tags": exp.tags or {}
                })
            
            self.write({"experiments": experiments_data})
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})


class ExperimentHandler(MLflowBaseHandler):
    """Handler for getting experiment details"""
    
    def get(self, experiment_id: str):
        """Get experiment details"""
        try:
            tracking_uri = self.get_tracking_uri()
            client = get_mlflow_client(tracking_uri)
            
            experiment = client.get_experiment(experiment_id)
            
            self.write({
                "experiment_id": experiment.experiment_id,
                "name": experiment.name,
                "artifact_location": experiment.artifact_location,
                "lifecycle_stage": experiment.lifecycle_stage,
                "tags": experiment.tags or {}
            })
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})


class RunsHandler(MLflowBaseHandler):
    """Handler for listing runs"""
    
    def get(self, experiment_id: str):
        """Get list of runs for an experiment"""
        try:
            tracking_uri = self.get_tracking_uri()
            client = get_mlflow_client(tracking_uri)
            
            runs = client.search_runs(
                experiment_ids=[experiment_id],
                max_results=1000
            )
            
            runs_data = []
            for run in runs:
                runs_data.append({
                    "run_id": run.info.run_id,
                    "run_name": run.info.run_name,
                    "experiment_id": run.info.experiment_id,
                    "status": run.info.status,
                    "start_time": run.info.start_time,
                    "end_time": run.info.end_time,
                    "user_id": run.info.user_id,
                    "metrics": {k: v for k, v in run.data.metrics.items()},
                    "params": {k: v for k, v in run.data.params.items()},
                    "tags": {k: v for k, v in run.data.tags.items()},
                    "artifact_uri": run.info.artifact_uri
                })
            
            self.write({"runs": runs_data})
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})


class RunHandler(MLflowBaseHandler):
    """Handler for getting run details"""
    
    def get(self, run_id: str):
        """Get run details"""
        try:
            tracking_uri = self.get_tracking_uri()
            client = get_mlflow_client(tracking_uri)
            
            run = client.get_run(run_id)
            
            self.write({
                "run_id": run.info.run_id,
                "run_name": run.info.run_name,
                "experiment_id": run.info.experiment_id,
                "status": run.info.status,
                "start_time": run.info.start_time,
                "end_time": run.info.end_time,
                "user_id": run.info.user_id,
                "metrics": {k: v for k, v in run.data.metrics.items()},
                "params": {k: v for k, v in run.data.params.items()},
                "tags": {k: v for k, v in run.data.tags.items()},
                "artifact_uri": run.info.artifact_uri
            })
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})


class ArtifactsHandler(MLflowBaseHandler):
    """Handler for listing artifacts"""
    
    def get(self, run_id: str):
        """Get list of artifacts for a run"""
        try:
            tracking_uri = self.get_tracking_uri()
            client = get_mlflow_client(tracking_uri)
            
            run = client.get_run(run_id)
            artifact_uri = run.info.artifact_uri
            
            # Get optional path parameter for listing artifacts in a directory
            path = self.get_query_argument("path", None)
            
            # List artifacts using MLflow client
            artifacts = []
            try:
                if path:
                    artifact_list = client.list_artifacts(run_id, path)
                else:
                    artifact_list = client.list_artifacts(run_id)
                for artifact in artifact_list:
                    artifacts.append({
                        "path": artifact.path,
                        "is_dir": artifact.is_dir,
                        "file_size": artifact.file_size if hasattr(artifact, 'file_size') else None
                    })
            except Exception as e:
                # If list_artifacts fails, return basic info
                self.log.warning(f"Could not list artifacts: {e}")
            
            self.write({
                "run_id": run_id,
                "artifact_uri": artifact_uri,
                "artifacts": artifacts
            })
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})


class ArtifactDownloadHandler(MLflowBaseHandler):
    """Handler for downloading artifacts"""
    
    def get(self, run_id: str):
        """Download an artifact"""
        try:
            path = self.get_query_argument("path", "")
            if not path:
                self.set_status(400)
                self.write({"error": "path parameter is required"})
                return
            
            tracking_uri = self.get_tracking_uri()
            client = get_mlflow_client(tracking_uri)
            
            # Check if artifact is a directory first
            try:
                artifacts = client.list_artifacts(run_id, path)
                # If list_artifacts returns items, it's a directory
                if artifacts:
                    self.set_status(400)
                    self.write({"error": f"'{path}' is a directory. Cannot download directories. Expand to see files inside."})
                    return
            except Exception:
                # If list_artifacts fails, try to download anyway
                pass
            
            # Check if the path itself is a directory by trying to list it
            try:
                # List parent directory to check if this path is a directory
                parent_path = os.path.dirname(path) if os.path.dirname(path) else None
                if parent_path:
                    parent_artifacts = client.list_artifacts(run_id, parent_path)
                    for art in parent_artifacts:
                        if art.path == path and art.is_dir:
                            self.set_status(400)
                            self.write({"error": f"'{path}' is a directory. Cannot download directories. Expand to see files inside."})
                            return
            except Exception:
                pass
            
            # Download artifact
            artifact_path = client.download_artifacts(run_id, path)
            
            # Check if downloaded path is actually a directory
            if os.path.isdir(artifact_path):
                self.set_status(400)
                self.write({"error": f"'{path}' is a directory. Cannot download directories. Expand to see files inside."})
                return
            
            # Read and return file content
            with open(artifact_path, "rb") as f:
                content = f.read()
            
            # Determine content type
            content_type = "application/octet-stream"
            if path.endswith(".json"):
                content_type = "application/json"
            elif path.endswith(".csv"):
                content_type = "text/csv"
            elif path.endswith(".txt") or path.endswith(".log"):
                content_type = "text/plain"
            elif path.endswith(".png"):
                content_type = "image/png"
            elif path.endswith(".jpg") or path.endswith(".jpeg"):
                content_type = "image/jpeg"
            elif path.endswith(".html"):
                content_type = "text/html"
            
            self.set_header("Content-Type", content_type)
            self.set_header("Content-Disposition", f'attachment; filename="{os.path.basename(path)}"')
            self.write(content)
        except Exception as e:
            error_msg = str(e)
            # Check if error is about directory
            if "Is a directory" in error_msg or "[Errno 21]" in error_msg:
                self.set_status(400)
                self.write({"error": f"'{path}' is a directory. Cannot download directories. Expand to see files inside."})
            else:
                self.set_status(500)
                self.write({"error": error_msg})


class ModelsHandler(MLflowBaseHandler):
    """Handler for listing models from model registry"""
    
    def get(self):
        """Get list of registered models"""
        try:
            tracking_uri = self.get_tracking_uri()
            client = get_mlflow_client(tracking_uri)
            
            # Get all registered models
            models = client.search_registered_models()
            
            models_data = []
            for model in models:
                models_data.append({
                    "name": model.name,
                    "latest_versions": [
                        {
                            "version": v.version,
                            "stage": v.current_stage,
                            "status": v.status,
                            "run_id": v.run_id,
                            "creation_timestamp": v.creation_timestamp
                        }
                        for v in model.latest_versions
                    ],
                    "creation_timestamp": model.creation_timestamp,
                    "last_updated_timestamp": model.last_updated_timestamp,
                    "description": model.description,
                    "tags": model.tags or {}
                })
            
            self.write({"models": models_data})
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})


class ModelHandler(MLflowBaseHandler):
    """Handler for getting model details"""
    
    def get(self, model_name: str):
        """Get model details"""
        try:
            tracking_uri = self.get_tracking_uri()
            client = get_mlflow_client(tracking_uri)
            
            model = client.get_registered_model(model_name)
            
            # Get all versions
            versions = []
            for version in model.latest_versions:
                versions.append({
                    "version": version.version,
                    "stage": version.current_stage,
                    "status": version.status,
                    "run_id": version.run_id,
                    "creation_timestamp": version.creation_timestamp,
                    "description": version.description
                })
            
            self.write({
                "name": model.name,
                "versions": versions,
                "creation_timestamp": model.creation_timestamp,
                "last_updated_timestamp": model.last_updated_timestamp,
                "description": model.description,
                "tags": model.tags or {}
            })
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})


class ConnectionTestHandler(MLflowBaseHandler):
    """Handler for testing MLflow connection"""
    
    def post(self):
        """Test connection to MLflow server"""
        try:
            body = json.loads(self.request.body.decode("utf-8"))
            tracking_uri = body.get("tracking_uri")
            
            if not tracking_uri:
                self.set_status(400)
                self.write({"error": "tracking_uri is required"})
                return
            
            client = get_mlflow_client(tracking_uri)
            
            # Try to list experiments to test connection
            experiments = client.search_experiments(max_results=1)
            
            self.write({
                "success": True,
                "message": "Connection successful",
                "experiment_count": len(experiments)
            })
        except Exception as e:
            self.set_status(500)
            self.write({
                "success": False,
                "error": str(e)
            })


class LocalMLflowServerHandler(MLflowBaseHandler):
    """Handler for managing local MLflow server"""
    
    def get(self):
        """Get status of local MLflow server"""
        try:
            status = get_mlflow_server_status()
            self.write(status)
        except Exception as e:
            self.set_status(500)
            self.write({
                "success": False,
                "error": str(e)
            })
    
    def post(self):
        """Start local MLflow server"""
        try:
            body = json.loads(self.request.body.decode("utf-8"))
            port = body.get("port", 5000)
            tracking_uri = body.get("tracking_uri", "sqlite:///mlflow.db")
            artifact_uri = body.get("artifact_uri")
            backend_uri = body.get("backend_uri")
            
            result = start_mlflow_server(
                port=port,
                tracking_uri=tracking_uri,
                artifact_uri=artifact_uri,
                backend_uri=backend_uri
            )
            
            if not result.get("success"):
                self.set_status(500)
            
            self.write(result)
        except Exception as e:
            self.set_status(500)
            self.write({
                "success": False,
                "error": str(e)
            })
    
    def delete(self):
        """Stop local MLflow server"""
        try:
            result = stop_mlflow_server()
            if not result.get("success"):
                self.set_status(500)
            self.write(result)
        except Exception as e:
            self.set_status(500)
            self.write({
                "success": False,
                "error": str(e)
            })


def setup_handlers(web_app):
    """Setup API handlers"""
    host_pattern = ".*$"
    
    base_url = web_app.settings.get("base_url", "/")
    
    handlers = [
        (f"{base_url}mlflow/api/experiments", ExperimentsHandler),
        (f"{base_url}mlflow/api/experiments/([^/]+)", ExperimentHandler),
        (f"{base_url}mlflow/api/experiments/([^/]+)/runs", RunsHandler),
        (f"{base_url}mlflow/api/runs/([^/]+)", RunHandler),
        (f"{base_url}mlflow/api/runs/([^/]+)/artifacts", ArtifactsHandler),
        (f"{base_url}mlflow/api/runs/([^/]+)/artifacts/download", ArtifactDownloadHandler),
        (f"{base_url}mlflow/api/models", ModelsHandler),
        (f"{base_url}mlflow/api/models/([^/]+)", ModelHandler),
        (f"{base_url}mlflow/api/connection/test", ConnectionTestHandler),
        (f"{base_url}mlflow/api/local-server", LocalMLflowServerHandler),
    ]
    
    web_app.add_handlers(host_pattern, handlers)

