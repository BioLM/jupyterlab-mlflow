/**
 * Details/Object View component for MLflow
 * Shows metadata for selected object and table of child objects
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { MLflowClient, IExperiment, IRun, IModel, IArtifact, IModelVersion } from '../mlflow';
import { copyExperimentId, copyRunId, copyModelName, copyCode } from '../utils/copy';
import { generateGetRunCode } from '../utils/codegen';
import '../../style/index.css';

/**
 * Selected object type
 */
type SelectedObjectType = 'experiment' | 'run' | 'artifact' | 'model' | 'version' | null;

/**
 * Selected object
 */
interface ISelectedObject {
  type: SelectedObjectType;
  data: any;
  parent?: ISelectedObject | null;
}

/**
 * Details view props
 */
interface IDetailsViewProps {
  mlflowClient: MLflowClient;
  app?: JupyterFrontEnd;
  initialSelection?: { type: 'experiment' | 'run' | 'artifact' | 'model' | 'version'; id: string; data?: any };
  onObjectSelect?: (type: 'experiment' | 'run' | 'artifact' | 'model' | 'version' | null, id: string) => void;
}

/**
 * Details view component
 */
export function DetailsView(props: IDetailsViewProps): JSX.Element {
  const { mlflowClient, app, initialSelection, onObjectSelect } = props;
  const [activeTab, setActiveTab] = useState<'experiments' | 'models'>('experiments');
  const [selectedObject, setSelectedObject] = useState<ISelectedObject | null>(null);
  const [experiments, setExperiments] = useState<IExperiment[]>([]);
  const [runs, setRuns] = useState<IRun[]>([]);
  const [artifacts, setArtifacts] = useState<IArtifact[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [modelVersions, setModelVersions] = useState<IModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialSelectionProcessed = useRef(false);

  // Load experiments
  const loadExperiments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const exps = await mlflowClient.getExperiments();
      setExperiments(exps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load experiments');
    } finally {
      setLoading(false);
    }
  }, [mlflowClient]);

  // Load models
  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const mods = await mlflowClient.getModels();
      setModels(mods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, [mlflowClient]);

  // Load experiment details
  const loadExperiment = useCallback(async (experimentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const exp = await mlflowClient.getExperiment(experimentId);
      setSelectedObject({ type: 'experiment', data: exp, parent: null });
      const runList = await mlflowClient.getRuns(experimentId);
      setRuns(runList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load experiment');
    } finally {
      setLoading(false);
    }
  }, [mlflowClient]);

  // Load run details
  const loadRun = useCallback(async (runId: string) => {
    try {
      setLoading(true);
      setError(null);
      const run = await mlflowClient.getRun(runId);
      const parent = selectedObject || undefined;
      setSelectedObject({ type: 'run', data: run, parent: parent || undefined });
      const artList = await mlflowClient.getArtifacts(runId);
      setArtifacts(artList.artifacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run');
    } finally {
      setLoading(false);
    }
  }, [mlflowClient, selectedObject]);

  // Load model details
  const loadModel = useCallback(async (modelName: string) => {
    try {
      setLoading(true);
      setError(null);
      const model = await mlflowClient.getModel(modelName);
      setSelectedObject({ type: 'model', data: model, parent: null });
      setModelVersions(model.latest_versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model');
    } finally {
      setLoading(false);
    }
  }, [mlflowClient]);

  // Load model version details
  const loadModelVersion = useCallback(async (modelName: string, version: string) => {
    try {
      setLoading(true);
      setError(null);
      const model = await mlflowClient.getModel(modelName);
      const versionData = model.latest_versions.find(v => v.version === version);
      if (versionData) {
        const parent = selectedObject || undefined;
        setSelectedObject({ type: 'version', data: { ...versionData, modelName }, parent: parent || undefined });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model version');
    } finally {
      setLoading(false);
    }
  }, [mlflowClient, selectedObject]);

  // Handle object selection
  const handleObjectSelect = useCallback((type: SelectedObjectType, id: string, data?: any) => {
    if (onObjectSelect) {
      onObjectSelect(type, id);
    }
    
    if (type === 'experiment') {
      loadExperiment(id);
    } else if (type === 'run') {
      loadRun(id);
    } else if (type === 'model') {
      loadModel(id);
    } else if (type === 'version' && data?.modelName) {
      loadModelVersion(data.modelName, id);
    } else if (type === 'artifact' && data) {
      setSelectedObject(prev => ({ type: 'artifact', data, parent: prev || undefined }));
    }
  }, [onObjectSelect, loadExperiment, loadRun, loadModel, loadModelVersion]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    setSelectedObject(prev => {
      if (prev?.parent) {
        // Reload child data for parent
        if (prev.parent.type === 'experiment') {
          mlflowClient.getRuns(prev.parent.data.experiment_id).then(setRuns).catch(console.error);
        } else if (prev.parent.type === 'model') {
          mlflowClient.getModel(prev.parent.data.name).then(model => {
            setModelVersions(model.latest_versions || []);
          }).catch(console.error);
        }
        return prev.parent;
      } else {
        // Reset to top level
        if (activeTab === 'experiments') {
          loadExperiments();
        } else {
          loadModels();
        }
        return null;
      }
    });
  }, [activeTab, mlflowClient, loadExperiments, loadModels]);

  // Initial load
  useEffect(() => {
    if (initialSelection && !initialSelectionProcessed.current) {
      initialSelectionProcessed.current = true;
      handleObjectSelect(initialSelection.type, initialSelection.id, initialSelection.data);
    } else if (!selectedObject && !initialSelection) {
      if (activeTab === 'experiments') {
        loadExperiments();
      } else {
        loadModels();
      }
    }
  }, [activeTab, handleObjectSelect, loadExperiments, loadModels, initialSelection, selectedObject]);

  // Handle initial selection when it changes
  useEffect(() => {
    if (initialSelection && initialSelection.id && !initialSelectionProcessed.current) {
      initialSelectionProcessed.current = true;
      handleObjectSelect(initialSelection.type, initialSelection.id, initialSelection.data);
    }
  }, [initialSelection?.id, initialSelection?.type, handleObjectSelect]);

  // Render metadata section
  const renderMetadata = () => {
    if (!selectedObject) return null;

    const { type, data } = selectedObject;

    if (type === 'experiment') {
      return (
        <div className="mlflow-details-metadata">
          <h3 className="mlflow-details-title">Experiment: {data.name || data.experiment_id}</h3>
          <div className="mlflow-details-grid">
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Experiment ID:</span>
              <span className="mlflow-details-value">{data.experiment_id}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Name:</span>
              <span className="mlflow-details-value">{data.name || '(unnamed)'}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Artifact Location:</span>
              <span className="mlflow-details-value">{data.artifact_location}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Lifecycle Stage:</span>
              <span className="mlflow-details-value">{data.lifecycle_stage}</span>
            </div>
            {data.tags && Object.keys(data.tags).length > 0 && (
              <div className="mlflow-details-item mlflow-details-item-full">
                <span className="mlflow-details-label">Tags:</span>
                <div className="mlflow-details-tags">
                  {Object.entries(data.tags).map(([key, value]) => (
                    <span key={key} className="mlflow-tag">{key}: {value as string}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (type === 'run') {
      const duration = data.end_time && data.start_time 
        ? `${((data.end_time - data.start_time) / 1000).toFixed(1)}s`
        : 'Running...';
      return (
        <div className="mlflow-details-metadata">
          <h3 className="mlflow-details-title">Run: {data.run_name || data.run_id}</h3>
          <div className="mlflow-details-grid">
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Run ID:</span>
              <span className="mlflow-details-value">{data.run_id}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Status:</span>
              <span className="mlflow-details-value">{data.status}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">User:</span>
              <span className="mlflow-details-value">{data.user_id}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Start Time:</span>
              <span className="mlflow-details-value">{new Date(data.start_time).toLocaleString()}</span>
            </div>
            {data.end_time && (
              <div className="mlflow-details-item">
                <span className="mlflow-details-label">End Time:</span>
                <span className="mlflow-details-value">{new Date(data.end_time).toLocaleString()}</span>
              </div>
            )}
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Duration:</span>
              <span className="mlflow-details-value">{duration}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Artifact URI:</span>
              <span className="mlflow-details-value">{data.artifact_uri}</span>
            </div>
            {data.metrics && Object.keys(data.metrics).length > 0 && (
              <div className="mlflow-details-item mlflow-details-item-full">
                <span className="mlflow-details-label">Metrics:</span>
                <div className="mlflow-details-metrics">
                  {Object.entries(data.metrics).map(([key, value]) => (
                    <span key={key} className="mlflow-metric">{key}: {value as number}</span>
                  ))}
                </div>
              </div>
            )}
            {data.params && Object.keys(data.params).length > 0 && (
              <div className="mlflow-details-item mlflow-details-item-full">
                <span className="mlflow-details-label">Parameters:</span>
                <div className="mlflow-details-params">
                  {Object.entries(data.params).map(([key, value]) => (
                    <span key={key} className="mlflow-param">{key}: {value as string}</span>
                  ))}
                </div>
              </div>
            )}
            {data.tags && Object.keys(data.tags).length > 0 && (
              <div className="mlflow-details-item mlflow-details-item-full">
                <span className="mlflow-details-label">Tags:</span>
                <div className="mlflow-details-tags">
                  {Object.entries(data.tags).map(([key, value]) => (
                    <span key={key} className="mlflow-tag">{key}: {value as string}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (type === 'model') {
      return (
        <div className="mlflow-details-metadata">
          <h3 className="mlflow-details-title">Model: {data.name}</h3>
          <div className="mlflow-details-grid">
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Name:</span>
              <span className="mlflow-details-value">{data.name}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Created:</span>
              <span className="mlflow-details-value">{new Date(data.creation_timestamp).toLocaleString()}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Last Updated:</span>
              <span className="mlflow-details-value">{new Date(data.last_updated_timestamp).toLocaleString()}</span>
            </div>
            {data.description && (
              <div className="mlflow-details-item mlflow-details-item-full">
                <span className="mlflow-details-label">Description:</span>
                <span className="mlflow-details-value">{data.description}</span>
              </div>
            )}
            {data.tags && Object.keys(data.tags).length > 0 && (
              <div className="mlflow-details-item mlflow-details-item-full">
                <span className="mlflow-details-label">Tags:</span>
                <div className="mlflow-details-tags">
                  {Object.entries(data.tags).map(([key, value]) => (
                    <span key={key} className="mlflow-tag">{key}: {value as string}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (type === 'version') {
      return (
        <div className="mlflow-details-metadata">
          <h3 className="mlflow-details-title">Model Version: {data.version}</h3>
          <div className="mlflow-details-grid">
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Version:</span>
              <span className="mlflow-details-value">{data.version}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Stage:</span>
              <span className="mlflow-details-value">{data.stage}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Status:</span>
              <span className="mlflow-details-value">{data.status}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Run ID:</span>
              <span className="mlflow-details-value">{data.run_id}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Created:</span>
              <span className="mlflow-details-value">{new Date(data.creation_timestamp).toLocaleString()}</span>
            </div>
            {data.description && (
              <div className="mlflow-details-item mlflow-details-item-full">
                <span className="mlflow-details-label">Description:</span>
                <span className="mlflow-details-value">{data.description}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (type === 'artifact') {
      return (
        <div className="mlflow-details-metadata">
          <h3 className="mlflow-details-title">Artifact: {data.path}</h3>
          <div className="mlflow-details-grid">
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Path:</span>
              <span className="mlflow-details-value">{data.path}</span>
            </div>
            <div className="mlflow-details-item">
              <span className="mlflow-details-label">Type:</span>
              <span className="mlflow-details-value">{data.is_dir ? 'Directory' : 'File'}</span>
            </div>
            {data.file_size !== null && (
              <div className="mlflow-details-item">
                <span className="mlflow-details-label">Size:</span>
                <span className="mlflow-details-value">{formatFileSize(data.file_size)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get last 6 digits of run ID
  const getRunIdSuffix = (runId: string): string => {
    return runId.length > 6 ? runId.slice(-6) : runId;
  };

  // Insert code into active notebook cell
  const insertCode = (code: string) => {
    if (!app) {
      alert('JupyterLab app not available');
      return;
    }

    const activeWidget = app.shell.currentWidget;
    
    if (!activeWidget) {
      alert('Please open a notebook first');
      return;
    }
    
    const notebook = (activeWidget as any).content;
    
    if (!notebook || !notebook.activeCell) {
      const mainWidgets = app.shell.widgets('main');
      for (const widget of mainWidgets) {
        const content = (widget as any).content;
        if (content && content.activeCell) {
          const cell = content.activeCell;
          if (cell.model) {
            if (cell.model.sharedModel) {
              cell.model.sharedModel.setSource(code);
              app.shell.activateById(widget.id);
              return;
            } else if (cell.model.value) {
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
    
    const activeCell = notebook.activeCell;
    if (!activeCell || !activeCell.model) {
      alert('Please select a cell in the notebook');
      return;
    }
    
    if (activeCell.model.sharedModel) {
      activeCell.model.sharedModel.setSource(code);
    } else if (activeCell.model.value) {
      activeCell.model.value.text = code;
    }
    
    app.shell.activateById(activeWidget.id);
  };

  // Render child table
  const renderChildTable = () => {
    if (!selectedObject) {
      // Show initial table (experiments or models)
      if (activeTab === 'experiments') {
        return (
          <div className="mlflow-details-table-section">
            <h4 className="mlflow-details-section-title">Experiments</h4>
            <table className="mlflow-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map(exp => (
                  <tr key={exp.experiment_id} onClick={() => handleObjectSelect('experiment', exp.experiment_id, exp)}>
                    <td>{exp.experiment_id}</td>
                    <td>{exp.name || '(unnamed)'}</td>
                    <td>
                      <button
                        className="mlflow-button-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyExperimentId(exp.experiment_id);
                        }}
                      >
                        Copy ID
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else {
        return (
          <div className="mlflow-details-table-section">
            <h4 className="mlflow-details-section-title">Models</h4>
            <table className="mlflow-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Versions</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map(model => (
                  <tr key={model.name} onClick={() => handleObjectSelect('model', model.name, model)}>
                    <td>{model.name}</td>
                    <td>{model.latest_versions.length}</td>
                    <td>{new Date(model.last_updated_timestamp).toLocaleString()}</td>
                    <td>
                      <button
                        className="mlflow-button-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyModelName(model.name);
                        }}
                      >
                        Copy Name
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    const { type } = selectedObject;

    if (type === 'experiment') {
      return (
        <div className="mlflow-details-table-section">
          <h4 className="mlflow-details-section-title">Runs</h4>
          <table className="mlflow-table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.run_id} onClick={(e) => {
                  // Only open if click is not on a button
                  if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                    handleObjectSelect('run', run.run_id, run);
                  }
                }}>
                  <td>
                    <button
                      className="mlflow-run-id-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyRunId(run.run_id);
                      }}
                      title={run.run_id}
                    >
                      {getRunIdSuffix(run.run_id)}
                    </button>
                  </td>
                  <td>{run.run_name || '-'}</td>
                  <td>{run.status}</td>
                  <td>
                    <div className="mlflow-actions-group" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="mlflow-button-small"
                        onClick={() => copyCode(generateGetRunCode(run.run_id))}
                        title="Copy code: Get run"
                      >
                        📋
                      </button>
                      {app && (
                        <button
                          className="mlflow-button-small"
                          onClick={() => insertCode(generateGetRunCode(run.run_id))}
                          title="Insert code: Get run"
                        >
                          ➕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (type === 'run') {
      return (
        <div className="mlflow-details-table-section">
          <h4 className="mlflow-details-section-title">Artifacts</h4>
          <table className="mlflow-table">
            <thead>
              <tr>
                <th>Path</th>
                <th>Type</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {artifacts.map(artifact => (
                <tr key={artifact.path} onClick={() => handleObjectSelect('artifact', artifact.path, artifact)}>
                  <td>{artifact.path}</td>
                  <td>{artifact.is_dir ? 'Directory' : 'File'}</td>
                  <td>{artifact.file_size !== null ? formatFileSize(artifact.file_size) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (type === 'model') {
      return (
        <div className="mlflow-details-table-section">
          <h4 className="mlflow-details-section-title">Versions</h4>
          <table className="mlflow-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Run ID</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {modelVersions.map(version => (
                <tr key={version.version} onClick={(e) => {
                  if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                    handleObjectSelect('version', version.version, { ...version, modelName: selectedObject.data.name });
                  }
                }}>
                  <td>{version.version}</td>
                  <td>{version.stage}</td>
                  <td>{version.status}</td>
                  <td>
                    <button
                      className="mlflow-run-id-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyRunId(version.run_id);
                      }}
                      title={version.run_id}
                    >
                      {getRunIdSuffix(version.run_id)}
                    </button>
                  </td>
                  <td>{new Date(version.creation_timestamp).toLocaleString()}</td>
                  <td>
                    <div className="mlflow-actions-group" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="mlflow-button-small"
                        onClick={() => copyCode(generateGetRunCode(version.run_id))}
                        title="Copy code: Get run"
                      >
                        📋
                      </button>
                      {app && (
                        <button
                          className="mlflow-button-small"
                          onClick={() => insertCode(generateGetRunCode(version.run_id))}
                          title="Insert code: Get run"
                        >
                          ➕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mlflow-details-view">
      <div className="mlflow-tabs">
        <button
          className={`mlflow-tab ${activeTab === 'experiments' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('experiments');
            setSelectedObject(null);
            loadExperiments();
          }}
        >
          Experiments
        </button>
        <button
          className={`mlflow-tab ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('models');
            setSelectedObject(null);
            loadModels();
          }}
        >
          Models
        </button>
      </div>

      {error && (
        <div className="mlflow-error">
          Error: {error}
          <button onClick={() => {
            setError(null);
            if (activeTab === 'experiments') {
              loadExperiments();
            } else {
              loadModels();
            }
          }}>Retry</button>
        </div>
      )}

      {loading && !selectedObject && (
        <div className="mlflow-loading">Loading...</div>
      )}

      <div className="mlflow-details-content">
        {selectedObject && (
          <div className="mlflow-details-navigation">
            <button className="mlflow-button" onClick={handleBack}>
              ← Back
            </button>
          </div>
        )}
        
        {renderMetadata()}
        {renderChildTable()}
      </div>
    </div>
  );
}

