/**
 * MLflow Shortcuts Panel Component
 * Displays common MLflow operations that can be injected into notebook cells
 */

import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import '../../style/index.css';

/**
 * Shortcut item interface
 */
interface IShortcut {
  title: string;
  description: string;
  code: string;
  category: string;
}

/**
 * Shortcuts panel props
 */
interface IShortcutsPanelProps {
  app: JupyterFrontEnd;
}

/**
 * Common MLflow shortcuts
 */
const SHORTCUTS: IShortcut[] = [
  // Setup & Configuration
  {
    title: 'Import MLflow',
    description: 'Import the MLflow library',
    code: 'import mlflow\n',
    category: 'Setup'
  },
  {
    title: 'Set Tracking URI',
    description: 'Set the MLflow tracking server URI',
    code: 'mlflow.set_tracking_uri("http://localhost:5000")\n',
    category: 'Setup'
  },
  
  // Experiments
  {
    title: 'Create Experiment',
    description: 'Create a new MLflow experiment',
    code: 'experiment_id = mlflow.create_experiment(\n    name="my_experiment"\n)\nprint(f"Created experiment: {experiment_id}")\n',
    category: 'Experiments'
  },
  {
    title: 'Get Experiment',
    description: 'Get experiment details by ID',
    code: 'experiment = mlflow.get_experiment(experiment_id="0")\nprint(f"Name: {experiment.name}")\nprint(f"Artifact Location: {experiment.artifact_location}")\n',
    category: 'Experiments'
  },
  {
    title: 'Set Active Experiment',
    description: 'Set the active experiment for logging',
    code: 'mlflow.set_experiment("my_experiment")\n',
    category: 'Experiments'
  },
  {
    title: 'List Experiments',
    description: 'List all experiments',
    code: 'experiments = mlflow.search_experiments()\nfor exp in experiments:\n    print(f"{exp.experiment_id}: {exp.name}")\n',
    category: 'Experiments'
  },
  
  // Runs
  {
    title: 'Start Run',
    description: 'Start a new MLflow run',
    code: 'with mlflow.start_run() as run:\n    print(f"Run ID: {run.info.run_id}")\n    # Your code here\n',
    category: 'Runs'
  },
  {
    title: 'Start Run with Name',
    description: 'Start a named run',
    code: 'with mlflow.start_run(run_name="my_run") as run:\n    print(f"Run ID: {run.info.run_id}")\n    # Your code here\n',
    category: 'Runs'
  },
  {
    title: 'Get Run',
    description: 'Get run details by run ID',
    code: 'run = mlflow.get_run(run_id="your-run-id")\nprint(f"Status: {run.info.status}")\nprint(f"Metrics: {run.data.metrics}")\nprint(f"Parameters: {run.data.params}")\n',
    category: 'Runs'
  },
  {
    title: 'Search Runs',
    description: 'Search runs in an experiment',
    code: 'runs = mlflow.search_runs(experiment_ids=["0"])\nprint(runs.head())\n',
    category: 'Runs'
  },
  
  // Logging
  {
    title: 'Log Parameter',
    description: 'Log a parameter value',
    code: 'mlflow.log_param("learning_rate", 0.01)\n',
    category: 'Logging'
  },
  {
    title: 'Log Multiple Parameters',
    description: 'Log multiple parameters at once',
    code: 'mlflow.log_params({\n    "learning_rate": 0.01,\n    "batch_size": 32,\n    "epochs": 10\n})\n',
    category: 'Logging'
  },
  {
    title: 'Log Metric',
    description: 'Log a metric value',
    code: 'mlflow.log_metric("accuracy", 0.95)\n',
    category: 'Logging'
  },
  {
    title: 'Log Multiple Metrics',
    description: 'Log multiple metrics at once',
    code: 'mlflow.log_metrics({\n    "accuracy": 0.95,\n    "f1_score": 0.92,\n    "loss": 0.05\n})\n',
    category: 'Logging'
  },
  {
    title: 'Log Metric Over Time',
    description: 'Log a metric at a specific step',
    code: 'for step in range(10):\n    mlflow.log_metric("loss", 1.0 / (step + 1), step=step)\n',
    category: 'Logging'
  },
  {
    title: 'Log Artifact',
    description: 'Log a file as an artifact',
    code: 'mlflow.log_artifact("path/to/file.txt")\n',
    category: 'Logging'
  },
  {
    title: 'Log Artifacts Directory',
    description: 'Log all files in a directory',
    code: 'mlflow.log_artifacts("path/to/directory")\n',
    category: 'Logging'
  },
  {
    title: 'Log Text',
    description: 'Log text as an artifact',
    code: 'mlflow.log_text("Some text content", "output.txt")\n',
    category: 'Logging'
  },
  {
    title: 'Log JSON',
    description: 'Log a dictionary as JSON artifact',
    code: 'import json\n\ndata = {"key": "value"}\nmlflow.log_dict(data, "data.json")\n',
    category: 'Logging'
  },
  {
    title: 'Log Image',
    description: 'Log an image as an artifact',
    code: 'from PIL import Image\n\nimg = Image.open("image.png")\nmlflow.log_image(img, "image.png")\n',
    category: 'Logging'
  },
  {
    title: 'Log Figure',
    description: 'Log a matplotlib figure',
    code: 'import matplotlib.pyplot as plt\n\nfig, ax = plt.subplots()\nax.plot([1, 2, 3], [1, 4, 9])\nmlflow.log_figure(fig, "plot.png")\n',
    category: 'Logging'
  },
  
  // Models
  {
    title: 'Log Model (sklearn)',
    description: 'Log a scikit-learn model',
    code: 'from sklearn.ensemble import RandomForestClassifier\n\nmodel = RandomForestClassifier()\nmlflow.sklearn.log_model(model, "model")\n',
    category: 'Models'
  },
  {
    title: 'Log Model (PyTorch)',
    description: 'Log a PyTorch model',
    code: 'import torch\n\nmodel = torch.nn.Linear(10, 1)\nmlflow.pytorch.log_model(model, "model")\n',
    category: 'Models'
  },
  {
    title: 'Log Model (TensorFlow)',
    description: 'Log a TensorFlow/Keras model',
    code: 'import tensorflow as tf\n\nmodel = tf.keras.Sequential([...])\nmlflow.tensorflow.log_model(model, "model")\n',
    category: 'Models'
  },
  {
    title: 'Log Model (XGBoost)',
    description: 'Log an XGBoost model',
    code: 'import xgboost as xgb\n\nmodel = xgb.XGBClassifier()\nmlflow.xgboost.log_model(model, "model")\n',
    category: 'Models'
  },
  {
    title: 'Load Model',
    description: 'Load a logged model',
    code: 'model = mlflow.pyfunc.load_model("runs:/run-id/model")\n',
    category: 'Models'
  },
  {
    title: 'Load Model from Registry',
    description: 'Load a model from the model registry',
    code: 'model = mlflow.pyfunc.load_model("models:/model-name/1")\n',
    category: 'Models'
  },
  {
    title: 'Register Model',
    description: 'Register a model in the model registry',
    code: 'mlflow.register_model(\n    model_uri="runs:/run-id/model",\n    name="my_model"\n)\n',
    category: 'Models'
  },
  
  // Model Registry
  {
    title: 'List Registered Models',
    description: 'List all registered models',
    code: 'models = mlflow.search_registered_models()\nfor model in models:\n    print(f"{model.name}: {model.latest_versions}")\n',
    category: 'Model Registry'
  },
  {
    title: 'Get Model Version',
    description: 'Get details of a specific model version',
    code: 'model_version = mlflow.get_model_version(\n    name="my_model",\n    version=1\n)\nprint(f"Stage: {model_version.current_stage}")\n',
    category: 'Model Registry'
  },
  {
    title: 'Transition Model Stage',
    description: 'Transition a model version to a new stage',
    code: 'mlflow.transition_model_version_stage(\n    name="my_model",\n    version=1,\n    stage="Production"\n)\n',
    category: 'Model Registry'
  },
  
  // Artifacts
  {
    title: 'Download Artifacts',
    description: 'Download artifacts from a run',
    code: 'artifact_path = mlflow.artifacts.download_artifacts(\n    run_id="run-id",\n    artifact_path="model"\n)\nprint(f"Downloaded to: {artifact_path}")\n',
    category: 'Artifacts'
  },
  {
    title: 'Load Artifact as Text',
    description: 'Load an artifact as text',
    code: 'text = mlflow.artifacts.load_text("runs:/run-id/artifact.txt")\nprint(text)\n',
    category: 'Artifacts'
  },
  {
    title: 'Load Artifact as JSON',
    description: 'Load an artifact as JSON',
    code: 'import json\n\ntext = mlflow.artifacts.load_text("runs:/run-id/data.json")\ndata = json.loads(text)\nprint(data)\n',
    category: 'Artifacts'
  },
  {
    title: 'List Artifacts',
    description: 'List artifacts in a run',
    code: 'artifacts = mlflow.artifacts.list_artifacts("runs:/run-id")\nfor artifact in artifacts:\n    print(f"{artifact.path} ({artifact.file_size} bytes)")\n',
    category: 'Artifacts'
  }
];

/**
 * Shortcuts panel component
 */
export function ShortcutsPanel(props: IShortcutsPanelProps): JSX.Element {
  const { app } = props;
  
  // Group shortcuts by category
  const shortcutsByCategory = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, IShortcut[]>);
  
  // Define preferred category order
  const preferredOrder = ['Setup', 'Experiments', 'Runs', 'Logging'];
  const otherCategories = Object.keys(shortcutsByCategory)
    .filter(cat => !preferredOrder.includes(cat))
    .sort();
  const categories = [...preferredOrder.filter(cat => shortcutsByCategory[cat]), ...otherCategories];
  
  /**
   * Insert code into the active notebook cell
   */
  const insertCode = (code: string) => {
    // Get the active widget from the shell
    const activeWidget = app.shell.currentWidget;
    
    if (!activeWidget) {
      alert('Please open a notebook first');
      return;
    }
    
    // Check if the active widget is a notebook
    // In JupyterLab, notebooks have a 'content' property with 'activeCell'
    const notebook = (activeWidget as any).content;
    
    if (!notebook || !notebook.activeCell) {
      // Try to find a notebook in the main area
      const mainWidgets = app.shell.widgets('main');
      for (const widget of mainWidgets) {
        const content = (widget as any).content;
        if (content && content.activeCell) {
          const cell = content.activeCell;
          if (cell.model) {
            // JupyterLab 4.x uses sharedModel
            if (cell.model.sharedModel) {
              cell.model.sharedModel.setSource(code);
              app.shell.activateById(widget.id);
              return;
            } else if (cell.model.value) {
              // Fallback for older versions
              cell.model.value.text = code;
              app.shell.activateById(widget.id);
              return;
            }
          }
        }
      }
      alert('Could not find active notebook cell. Please make sure a notebook is open and a cell is selected.');
      return;
    }
    
    // Get the active cell
    const activeCell = notebook.activeCell;
    if (!activeCell || !activeCell.model) {
      alert('Please select a cell in the notebook');
      return;
    }
    
    // Insert code into the cell
    if (activeCell.model.sharedModel) {
      // JupyterLab 4.x uses sharedModel
      activeCell.model.sharedModel.setSource(code);
    } else if (activeCell.model.value) {
      // Fallback for older versions
      activeCell.model.value.text = code;
    }
    
    // Activate the notebook
    app.shell.activateById(activeWidget.id);
  };
  
  return (
    <div className="mlflow-shortcuts-panel">
      <div className="mlflow-shortcuts-header">
        <h3>MLflow Shortcuts</h3>
        <p className="mlflow-shortcuts-description">
          Click on any shortcut to insert it into the active notebook cell
        </p>
      </div>
      <div className="mlflow-shortcuts-content">
        {categories.map(category => (
          <div key={category} className="mlflow-shortcuts-category">
            <h4 className="mlflow-shortcuts-category-title">{category}</h4>
            <div className="mlflow-shortcuts-list">
              {shortcutsByCategory[category].map((shortcut, index) => (
                <div
                  key={`${category}-${index}`}
                  className="mlflow-shortcut-item"
                  onClick={() => insertCode(shortcut.code)}
                  title={shortcut.description}
                >
                  <div className="mlflow-shortcut-title">{shortcut.title}</div>
                  <div className="mlflow-shortcut-description">{shortcut.description}</div>
                  <div className="mlflow-shortcut-code-preview">
                    <code>{shortcut.code.split('\n')[0]}{shortcut.code.split('\n').length > 1 ? '...' : ''}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

