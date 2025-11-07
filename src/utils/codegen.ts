/**
 * Code generation utilities for MLflow Python API snippets
 */

/**
 * Generate code to load a model from MLflow model registry
 */
export function generateLoadModelCode(
  modelName: string,
  version?: string,
  stage?: string
): string {
  if (stage) {
    return `model = mlflow.pyfunc.load_model("models:/${modelName}/${stage}")
`;
  } else if (version) {
    return `model = mlflow.pyfunc.load_model("models:/${modelName}/${version}")
`;
  } else {
    return `model = mlflow.pyfunc.load_model("models:/${modelName}/latest")
`;
  }
}

/**
 * Generate code to load a model from a run
 */
export function generateLoadModelFromRunCode(runId: string, modelPath: string = 'model'): string {
  return `model = mlflow.sklearn.load_model(f"runs:/${runId}/${modelPath}")
`;
}

/**
 * Generate code to get run details
 */
export function generateGetRunCode(runId: string): string {
  return `run = mlflow.get_run(run_id="${runId}")
print(f"Status: {run.info.status}")
print(f"Metrics: {run.data.metrics}")
print(f"Parameters: {run.data.params}")
`;
}

/**
 * Generate code to get experiment details
 */
export function generateGetExperimentCode(experimentId: string): string {
  return `experiment = mlflow.get_experiment(experiment_id="${experimentId}")
print(f"Name: {experiment.name}")
print(f"Artifact Location: {experiment.artifact_location}")
`;
}

/**
 * Generate code to search runs in an experiment
 */
export function generateSearchRunsCode(experimentId: string): string {
  return `import pandas as pd

runs = mlflow.search_runs(experiment_ids=["${experimentId}"])
print(runs.head())
`;
}

/**
 * Generate code to download artifacts
 */
export function generateDownloadArtifactCode(runId: string, artifactPath: string): string {
  return `artifact_path = mlflow.artifacts.download_artifacts(
    run_id="${runId}",
    artifact_path="${artifactPath}"
)
print(f"Downloaded to: {artifact_path}")
`;
}

/**
 * Generate code to load artifact as text
 */
export function generateLoadArtifactAsTextCode(runId: string, artifactPath: string): string {
  return `artifact_uri = f"runs:/${runId}/${artifactPath}"
text = mlflow.artifacts.load_text(artifact_uri)
print(text)
`;
}

/**
 * Generate code to load artifact as JSON
 */
export function generateLoadArtifactAsJsonCode(runId: string, artifactPath: string): string {
  return `import json

artifact_uri = f"runs:/${runId}/${artifactPath}"
text = mlflow.artifacts.load_text(artifact_uri)
data = json.loads(text)
print(data)
`;
}

/**
 * Generate code to load artifact as pandas DataFrame (for CSV)
 */
export function generateLoadArtifactAsDataFrameCode(runId: string, artifactPath: string): string {
  return `import pandas as pd

artifact_uri = f"runs:/${runId}/${artifactPath}"
df = pd.read_csv(artifact_uri)
print(df.head())
`;
}

/**
 * Generate code to load artifact as image (PIL/Pillow)
 */
export function generateLoadArtifactAsImageCode(runId: string, artifactPath: string): string {
  return `from PIL import Image
import io

artifact_uri = f"runs:/${runId}/${artifactPath}"
image_bytes = mlflow.artifacts.load_binary(artifact_uri)
image = Image.open(io.BytesIO(image_bytes))
image.show()
`;
}


