/**
 * Tree view component for MLflow experiments, runs, and artifacts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MLflowClient } from '../mlflow';
import { copyExperimentId, copyRunId, copyModelName } from '../utils/copy';
import { openArtifact } from './ArtifactViewer';

/**
 * Tree node type
 */
type TreeNodeType = 'experiment' | 'run' | 'artifact' | 'model' | 'version';

/**
 * Tree node
 */
interface ITreeNode {
  id: string;
  label: string;
  type: TreeNodeType;
  expanded: boolean;
  children: ITreeNode[];
  data?: any;
  loading?: boolean;
}

/**
 * Tree view props
 */
interface ITreeViewProps {
  mlflowClient: MLflowClient;
}

/**
 * Tree view component
 */
export function TreeView(props: ITreeViewProps): JSX.Element {
  const { mlflowClient } = props;
  const [experiments, setExperiments] = useState<ITreeNode[]>([]);
  const [models, setModels] = useState<ITreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'experiments' | 'models'>('experiments');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: ITreeNode } | null>(null);

  // Load experiments
  const loadExperiments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const exps = await mlflowClient.getExperiments();
      const nodes: ITreeNode[] = exps.map(exp => ({
        id: exp.experiment_id,
        label: exp.name || exp.experiment_id,
        type: 'experiment',
        expanded: false,
        children: [],
        data: exp
      }));
      setExperiments(nodes);
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
      const nodes: ITreeNode[] = mods.map(model => ({
        id: model.name,
        label: model.name,
        type: 'model',
        expanded: false,
        children: [],
        data: model
      }));
      setModels(nodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : ' Failed to load models');
    } finally {
      setLoading(false);
    }
  }, [mlflowClient]);

  useEffect(() => {
    loadExperiments();
    loadModels();
  }, [loadExperiments, loadModels]);

  // Toggle node expansion
  const toggleNode = async (node: ITreeNode, parentNodes: ITreeNode[], setNodes: (nodes: ITreeNode[]) => void) => {
    if (node.expanded) {
      // Collapse
      node.expanded = false;
      node.children = [];
    } else {
      // Expand and load children
      node.expanded = true;
      node.loading = true;
      setNodes([...parentNodes]);

      try {
        if (node.type === 'experiment') {
          const runs = await mlflowClient.getRuns(node.id);
          node.children = runs.map(run => ({
            id: run.run_id,
            label: run.run_name || run.run_id,
            type: 'run',
            expanded: false,
            children: [],
            data: run
          }));
        } else if (node.type === 'run') {
          const artifacts = await mlflowClient.getArtifacts(node.id);
          node.children = artifacts.artifacts.map(art => ({
            id: `${node.id}/${art.path}`,
            label: art.path.split('/').pop() || art.path,
            type: 'artifact',
            expanded: false,
            children: [],
            data: { ...art, runId: node.id }
          }));
        } else if (node.type === 'model') {
          const model = await mlflowClient.getModel(node.id);
          node.children = model.latest_versions.map((version: any) => ({
            id: `${node.id}/${version.version}`,
            label: `Version ${version.version} (${version.stage})`,
            type: 'version',
            expanded: false,
            children: [],
            data: { ...version, modelName: node.id }
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load children');
      } finally {
        node.loading = false;
        setNodes([...parentNodes]);
      }
    }
  };

  // Handle node click
  const handleNodeClick = async (node: ITreeNode, parentNodes: ITreeNode[], setNodes: (nodes: ITreeNode[]) => void) => {
    if (node.type === 'artifact') {
      // Open artifact
      openArtifact(node.data.runId, node.data.path, mlflowClient);
    } else {
      // Toggle expansion
      await toggleNode(node, parentNodes, setNodes);
    }
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, node: ITreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  // Handle copy
  const handleCopy = async (node: ITreeNode) => {
    let success = false;
    if (node.type === 'experiment') {
      success = await copyExperimentId(node.id);
    } else if (node.type === 'run') {
      success = await copyRunId(node.id);
    } else if (node.type === 'model') {
      success = await copyModelName(node.id);
    }
    
    if (success) {
      // Show toast notification (simple alert for now)
      alert(`Copied ${node.type} ID: ${node.id}`);
    }
    
    setContextMenu(null);
  };

  // Render tree node
  const renderTreeNode = (
    node: ITreeNode,
    level: number,
    parentNodes: ITreeNode[],
    setNodes: (nodes: ITreeNode[]) => void
  ): JSX.Element => {
    const indent = level * 20;
    const hasChildren = node.type === 'experiment' || node.type === 'run' || node.type === 'model';
    const icon = node.type === 'experiment' ? '📁' :
                 node.type === 'run' ? '▶️' :
                 node.type === 'artifact' ? '📄' :
                 node.type === 'model' ? '🤖' : '🔢';

    return (
      <div key={node.id}>
        <div
          className="mlflow-tree-node"
          style={{ paddingLeft: `${indent}px` }}
          onClick={() => handleNodeClick(node, parentNodes, setNodes)}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          <span className="mlflow-tree-icon">
            {hasChildren ? (node.expanded ? '▼' : '▶') : icon}
          </span>
          {node.loading && <span className="mlflow-loading">⏳</span>}
          <span className="mlflow-tree-label">{node.label}</span>
        </div>
        {node.expanded && node.children.map(child =>
          renderTreeNode(child, level + 1, node.children, (children) => {
            node.children = children;
            setNodes([...parentNodes]);
          })
        )}
      </div>
    );
  };

  return (
    <div className="mlflow-tree-view">
      <div className="mlflow-tabs">
        <button
          className={`mlflow-tab ${activeTab === 'experiments' ? 'active' : ''}`}
          onClick={() => setActiveTab('experiments')}
        >
          Experiments
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
          <button onClick={() => activeTab === 'experiments' ? loadExperiments() : loadModels()}>
            Retry
          </button>
        </div>
      )}

      {loading && experiments.length === 0 && models.length === 0 ? (
        <div className="mlflow-loading">Loading...</div>
      ) : (
        <div className="mlflow-tree-content">
          {activeTab === 'experiments' && experiments.map(node =>
            renderTreeNode(node, 0, experiments, setExperiments)
          )}
          {activeTab === 'models' && models.map(node =>
            renderTreeNode(node, 0, models, setModels)
          )}
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
              onClick={() => handleCopy(contextMenu.node)}
            >
              Copy {contextMenu.node.type} ID
            </div>
          </div>
        </>
      )}
    </div>
  );
}

