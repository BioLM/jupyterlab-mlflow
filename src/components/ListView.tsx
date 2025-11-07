/**
 * List view component for MLflow experiments, runs, and models
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MLflowClient, IExperiment, IRun, IModel } from '../mlflow';
import { copyExperimentId, copyRunId, copyModelName } from '../utils/copy';

/**
 * List view props
 */
interface IListViewProps {
  mlflowClient: MLflowClient;
}

/**
 * List view component
 */
export function ListView(props: IListViewProps): JSX.Element {
  const { mlflowClient } = props;
  const [activeTab, setActiveTab] = useState<'experiments' | 'runs' | 'models'>('experiments');
  const [experiments, setExperiments] = useState<IExperiment[]>([]);
  const [runs, setRuns] = useState<IRun[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: any; type: string } | null>(null);

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

  // Load runs for experiment
  const loadRuns = useCallback(async (experimentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const runList = await mlflowClient.getRuns(experimentId);
      setRuns(runList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
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

  useEffect(() => {
    if (activeTab === 'experiments') {
      loadExperiments();
    } else if (activeTab === 'models') {
      loadModels();
    } else if (activeTab === 'runs' && selectedExperiment) {
      loadRuns(selectedExperiment);
    }
  }, [activeTab, selectedExperiment, loadExperiments, loadModels, loadRuns]);

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort data
  const getSortedData = <T,>(data: T[], getValue: (item: T) => any): T[] => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, item: any, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
  };

  // Handle copy
  const handleCopy = async (item: any, type: string) => {
    let success = false;
    let id = '';
    
    if (type === 'experiment') {
      id = item.experiment_id;
      success = await copyExperimentId(id);
    } else if (type === 'run') {
      id = item.run_id;
      success = await copyRunId(id);
    } else if (type === 'model') {
      id = item.name;
      success = await copyModelName(id);
    }
    
    if (success) {
      alert(`Copied ${type} ID: ${id}`);
    }
    
    setContextMenu(null);
  };

  // Render experiments table
  const renderExperimentsTable = () => {
    const sorted = getSortedData(experiments, (exp) => {
      if (sortColumn === 'name') return exp.name;
      if (sortColumn === 'id') return exp.experiment_id;
      return exp.experiment_id;
    });

    return (
      <table className="mlflow-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('id')}>
              ID {sortColumn === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('name')}>
              Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(exp => (
            <tr
              key={exp.experiment_id}
              onClick={() => {
                setSelectedExperiment(exp.experiment_id);
                setActiveTab('runs');
              }}
              onContextMenu={(e) => handleContextMenu(e, exp, 'experiment')}
            >
              <td>{exp.experiment_id}</td>
              <td>{exp.name}</td>
              <td>
                <button
                  className="mlflow-button-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(exp, 'experiment');
                  }}
                >
                  Copy ID
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Render runs table
  const renderRunsTable = () => {
    const sorted = getSortedData(runs, (run) => {
      if (sortColumn === 'name') return run.run_name;
      if (sortColumn === 'status') return run.status;
      if (sortColumn === 'start_time') return run.start_time;
      return run.run_id;
    });

    return (
      <div>
        <button
          className="mlflow-button"
          onClick={() => {
            setActiveTab('experiments');
            setSelectedExperiment(null);
          }}
        >
          ← Back to Experiments
        </button>
        <table className="mlflow-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>
                Run ID {sortColumn === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('name')}>
                Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')}>
                Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Metrics</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(run => (
              <tr
                key={run.run_id}
                onContextMenu={(e) => handleContextMenu(e, run, 'run')}
              >
                <td>{run.run_id}</td>
                <td>{run.run_name || '-'}</td>
                <td>{run.status}</td>
                <td>
                  {Object.keys(run.metrics).slice(0, 2).map(key => (
                    <div key={key} className="mlflow-metric">
                      {key}: {run.metrics[key].toFixed(4)}
                    </div>
                  ))}
                </td>
                <td>
                  <button
                    className="mlflow-button-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(run, 'run');
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
  };

  // Render models table
  const renderModelsTable = () => {
    const sorted = getSortedData(models, (model) => {
      if (sortColumn === 'name') return model.name;
      if (sortColumn === 'updated') return model.last_updated_timestamp;
      return model.name;
    });

    return (
      <table className="mlflow-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>
              Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Versions</th>
            <th onClick={() => handleSort('updated')}>
              Last Updated {sortColumn === 'updated' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(model => (
            <tr
              key={model.name}
              onContextMenu={(e) => handleContextMenu(e, model, 'model')}
            >
              <td>{model.name}</td>
              <td>
                {model.latest_versions.map(v => (
                  <div key={v.version} className="mlflow-version">
                    v{v.version} ({v.stage})
                  </div>
                ))}
              </td>
              <td>{new Date(model.last_updated_timestamp).toLocaleString()}</td>
              <td>
                <button
                  className="mlflow-button-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(model, 'model');
                  }}
                >
                  Copy Name
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="mlflow-list-view">
      <div className="mlflow-tabs">
        <button
          className={`mlflow-tab ${activeTab === 'experiments' ? 'active' : ''}`}
          onClick={() => setActiveTab('experiments')}
        >
          Experiments
        </button>
        <button
          className={`mlflow-tab ${activeTab === 'runs' ? 'active' : ''}`}
          onClick={() => setActiveTab('runs')}
          disabled={!selectedExperiment}
        >
          Runs
        </button>
        <button
          className={`mlflow-tab ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          Models
        </button>
      </div>

      {error && (
        <div className="mlflow-error">
          Error: {error}
          <button onClick={() => {
            if (activeTab === 'experiments') loadExperiments();
            else if (activeTab === 'models') loadModels();
            else if (selectedExperiment) loadRuns(selectedExperiment);
          }}>
            Retry
          </button>
        </div>
      )}

      {loading && experiments.length === 0 && runs.length === 0 && models.length === 0 ? (
        <div className="mlflow-loading">Loading...</div>
      ) : (
        <div className="mlflow-list-content">
          {activeTab === 'experiments' && renderExperimentsTable()}
          {activeTab === 'runs' && renderRunsTable()}
          {activeTab === 'models' && renderModelsTable()}
        </div>
      )}

      {contextMenu && (
        <>
          <div
            className="mlflow-context-menu-overlay"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="mlflow-context-menu"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          >
            <div
              className="mlflow-context-menu-item"
              onClick={() => handleCopy(contextMenu.item, contextMenu.type)}
            >
              Copy {contextMenu.type} ID
            </div>
          </div>
        </>
      )}
    </div>
  );
}

