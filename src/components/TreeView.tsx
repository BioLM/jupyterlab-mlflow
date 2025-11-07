/**
 * Tree view component for MLflow experiments, runs, and artifacts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MLflowClient } from '../mlflow';
import { copyExperimentId, copyRunId, copyModelName, copyCode } from '../utils/copy';
import { ContentsManager } from '@jupyterlab/services';
import {
  generateLoadModelCode,
  generateGetRunCode,
  generateGetExperimentCode,
  generateDownloadArtifactCode,
  generateLoadModelFromRunCode,
  generateSearchRunsCode,
  generateLoadArtifactAsTextCode,
  generateLoadArtifactAsJsonCode,
  generateLoadArtifactAsDataFrameCode,
  generateLoadArtifactAsImageCode
} from '../utils/codegen';
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
      // Collapse - keep children cached, just hide them
      node.expanded = false;
      setNodes([...parentNodes]);
    } else {
      // Don't reload if already loading or if children already exist
      if (node.loading) {
        return;
      }
      
      // Only load children if we don't have them already
      if (node.children.length === 0) {
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
            type: 'artifact' as const,
            expanded: false,
            children: [],
            data: { 
              path: art.path,
              is_dir: Boolean(art.is_dir),  // Ensure boolean
              file_size: art.file_size,
              runId: node.id 
            }
          }));
        } else if (node.type === 'artifact' && Boolean(node.data?.is_dir)) {
          // Load sub-artifacts for directory - but only show files, not nested directories
          const artifacts = await mlflowClient.getArtifacts(node.data.runId, node.data.path);
          // Filter to only show files, not nested directories to prevent infinite loops
          node.children = artifacts.artifacts
            .filter(art => !art.is_dir) // Only show files, not nested directories
            .map(art => ({
              id: `${node.data.runId}/${art.path}`,
              label: art.path.split('/').pop() || art.path,
              type: 'artifact' as const,
              expanded: false,
              children: [],
              data: { 
                path: art.path,
                is_dir: false,  // These are filtered to be files only
                file_size: art.file_size,
                runId: node.data.runId 
              }
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
      } else {
        // Children already exist, just expand
        node.expanded = true;
        setNodes([...parentNodes]);
      }
    }
  };

  // Handle expand/collapse icon click
  const handleExpandClick = async (e: React.MouseEvent, node: ITreeNode, parentNodes: ITreeNode[], setNodes: (nodes: ITreeNode[]) => void) => {
    e.stopPropagation();
    await toggleNode(node, parentNodes, setNodes);
  };

  // Handle node click - artifacts NEVER expand, only open files
  const handleNodeClick = async (node: ITreeNode, parentNodes: ITreeNode[], setNodes: (nodes: ITreeNode[]) => void) => {
    if (node.type === 'artifact') {
      // ONLY open if it's a file, NEVER expand directories
      if (!node.data.is_dir) {
        openArtifact(node.data.runId, node.data.path, mlflowClient);
      }
      // Do nothing for directories - they can ONLY be expanded via the icon
      return;
    } else {
      // For non-artifacts, toggle expansion
      await toggleNode(node, parentNodes, setNodes);
    }
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, node: ITreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  // Handle copy ID
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
      // Toast notification is handled by copyCode function
    }
    
    setContextMenu(null);
  };

  // Handle download artifact - save to JupyterLab working directory
  const handleDownloadArtifact = async (node: ITreeNode) => {
    if (node.type !== 'artifact') {
      return;
    }
    
    try {
      const runId = node.data?.runId || node.id.split('/')[0];
      const artifactPath = node.data?.path || node.label;
      const fileName = artifactPath.split('/').pop() || `artifact_${runId}`;
      
      // Download artifact as blob
      const blob = await mlflowClient.downloadArtifact(runId, artifactPath);
      
      // Convert blob to base64
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Save to JupyterLab server using Contents API
      const serverSettings = mlflowClient.getServerSettings();
      const contents = new ContentsManager({ serverSettings });
      
      // Save to current directory (root of JupyterLab)
      await contents.save(fileName, {
        type: 'file',
        format: 'base64',
        content: base64data
      });
      
      // Show success - file saved to JupyterLab
      alert(`Artifact saved to: ${fileName}`);
    } catch (error) {
      console.error('Failed to download artifact:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a directory error
      if (errorMessage.includes('is a directory') || errorMessage.includes('Is a directory')) {
        alert('Cannot download directories. Expand the directory to see files inside, then download individual files.');
      } else {
        alert(`Failed to download: ${errorMessage}`);
      }
    }
  };


  // Handle copy code
  const handleCopyCode = async (node: ITreeNode, codeType: string) => {
    let code = '';
    
    if (node.type === 'model') {
      if (codeType === 'load') {
        const version = node.data?.latest_versions?.[0]?.version;
        const stage = node.data?.latest_versions?.[0]?.stage;
        code = generateLoadModelCode(node.data.name, version, stage);
      }
    } else if (node.type === 'run') {
      if (codeType === 'get') {
        code = generateGetRunCode(node.data.run_id);
      } else if (codeType === 'load-model') {
        code = generateLoadModelFromRunCode(node.data.run_id);
      }
    } else if (node.type === 'experiment') {
      if (codeType === 'get') {
        code = generateGetExperimentCode(node.data.experiment_id);
      } else if (codeType === 'search') {
        code = generateSearchRunsCode(node.data.experiment_id);
      }
    } else if (node.type === 'artifact') {
      const runId = node.data.runId || node.id.split('/')[0];
      const artifactPath = node.data.path || node.label;
      const extension = artifactPath.split('.').pop()?.toLowerCase() || '';
      
      if (codeType === 'download') {
        code = generateDownloadArtifactCode(runId, artifactPath);
      } else if (codeType === 'text') {
        code = generateLoadArtifactAsTextCode(runId, artifactPath);
      } else if (codeType === 'json' && extension === 'json') {
        code = generateLoadArtifactAsJsonCode(runId, artifactPath);
      } else if (codeType === 'dataframe' && (extension === 'csv' || extension === 'tsv')) {
        code = generateLoadArtifactAsDataFrameCode(runId, artifactPath);
      } else if (codeType === 'image' && ['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
        code = generateLoadArtifactAsImageCode(runId, artifactPath);
      }
    }
    
    if (code) {
      await copyCode(code);
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
    
    // Determine icon and expandability
    let icon: string;
    let canExpand: boolean;
    
    if (node.type === 'artifact') {
      // For artifacts: directories show arrows, files show bullets
      const isDir = Boolean(node.data?.is_dir);
      // TEST: Use completely different icons to verify code is running
      if (isDir) {
        // Directory: show expand/collapse arrow
        icon = node.expanded ? '🔽' : '▶️';
        canExpand = true;
      } else {
        // File: show bullet
        icon = '🔹';
        canExpand = false;
      }
    } else {
      // Other types: show arrow if expandable, otherwise show icon
      canExpand = hasChildren;
      if (canExpand) {
        icon = node.expanded ? '▼' : '▶';
      } else {
        icon = node.type === 'experiment' ? '📁' :
               node.type === 'run' ? '▶️' :
               node.type === 'model' ? '🤖' : '🔢';
      }
    }
    
    const isArtifactFile = node.type === 'artifact' && !Boolean(node.data?.is_dir);
    
    return (
      <div key={node.id}>
        <div
          className="mlflow-tree-node"
          style={{ paddingLeft: `${indent}px` }}
          onClick={() => handleNodeClick(node, parentNodes, setNodes)}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          <span 
            className="mlflow-tree-icon"
            onClick={(e) => canExpand && handleExpandClick(e, node, parentNodes, setNodes)}
            style={{ 
              cursor: canExpand ? 'pointer' : 'default', 
              display: 'inline-block', 
              minWidth: '16px',
              fontSize: '12px',
              lineHeight: '1',
              userSelect: 'none'
            }}
            title={node.type === 'artifact' ? (Boolean(node.data?.is_dir) ? 'Directory' : 'File') : ''}
          >
            {icon || ' '}
          </span>
          {node.loading && <span className="mlflow-loading">⏳</span>}
          <span className="mlflow-tree-label">{node.label}</span>
          <div style={{ display: 'flex', gap: '2px', marginLeft: '4px', alignItems: 'center' }}>
            {isArtifactFile && (
              <button
                className="mlflow-download-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDownloadArtifact(node);
                }}
                title="Download artifact"
                style={{ 
                  fontSize: '14px', 
                  padding: '2px 6px',
                  opacity: 0.7,
                  cursor: 'pointer'
                }}
              >
                ⬇
              </button>
            )}
            {(node.type === 'model' || node.type === 'run' || node.type === 'experiment' || node.type === 'artifact') && (
              <button
                className="mlflow-code-button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.type === 'model') {
                    handleCopyCode(node, 'load');
                  } else if (node.type === 'run') {
                    handleCopyCode(node, 'get');
                  } else if (node.type === 'experiment') {
                    handleCopyCode(node, 'get');
                  } else if (node.type === 'artifact') {
                    handleCopyCode(node, 'download');
                  }
                }}
                title={
                  node.type === 'model' ? 'Copy code: Load model' :
                  node.type === 'run' ? 'Copy code: Get run' :
                  node.type === 'experiment' ? 'Copy code: Get experiment' :
                  'Copy code: Download artifact'
                }
              >
                &lt;/&gt;
              </button>
            )}
          </div>
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
            {contextMenu.node.type === 'model' && (
              <>
                <div
                  className="mlflow-context-menu-item"
                  onClick={() => handleCopyCode(contextMenu.node, 'load')}
                >
                  Copy code: Load model
                </div>
                <div
                  className="mlflow-context-menu-item"
                  onClick={() => handleCopy(contextMenu.node)}
                >
                  Copy model name
                </div>
              </>
            )}
            {contextMenu.node.type === 'run' && (
              <>
                <div
                  className="mlflow-context-menu-item"
                  onClick={() => handleCopyCode(contextMenu.node, 'get')}
                >
                  Copy code: Get run
                </div>
                <div
                  className="mlflow-context-menu-item"
                  onClick={() => handleCopyCode(contextMenu.node, 'load-model')}
                >
                  Copy code: Load model from run
                </div>
                <div
                  className="mlflow-context-menu-item"
                  onClick={() => handleCopy(contextMenu.node)}
                >
                  Copy run ID
                </div>
              </>
            )}
            {contextMenu.node.type === 'experiment' && (
              <>
                <div
                  className="mlflow-context-menu-item"
                  onClick={() => handleCopyCode(contextMenu.node, 'get')}
                >
                  Copy code: Get experiment
                </div>
                <div
                  className="mlflow-context-menu-item"
                  onClick={() => handleCopyCode(contextMenu.node, 'search')}
                >
                  Copy code: Search runs
                </div>
                <div
                  className="mlflow-context-menu-item"
                  onClick={() => handleCopy(contextMenu.node)}
                >
                  Copy experiment ID
                </div>
              </>
            )}
            {contextMenu.node.type === 'artifact' && (
              <>
                <div
                  className="mlflow-context-menu-item"
                  onClick={() => handleCopyCode(contextMenu.node, 'download')}
                >
                  Copy code: Download artifact
                </div>
                <div
                  className="mlflow-context-menu-item"
                  onClick={() => handleCopyCode(contextMenu.node, 'text')}
                >
                  Copy code: Load as text
                </div>
                {contextMenu.node.data?.path?.endsWith('.json') && (
                  <div
                    className="mlflow-context-menu-item"
                    onClick={() => handleCopyCode(contextMenu.node, 'json')}
                  >
                    Copy code: Load as JSON
                  </div>
                )}
                {(contextMenu.node.data?.path?.endsWith('.csv') || contextMenu.node.data?.path?.endsWith('.tsv')) && (
                  <div
                    className="mlflow-context-menu-item"
                    onClick={() => handleCopyCode(contextMenu.node, 'dataframe')}
                  >
                    Copy code: Load as DataFrame
                  </div>
                )}
                {['png', 'jpg', 'jpeg', 'gif'].some(ext => contextMenu.node.data?.path?.endsWith(`.${ext}`)) && (
                  <div
                    className="mlflow-context-menu-item"
                    onClick={() => handleCopyCode(contextMenu.node, 'image')}
                  >
                    Copy code: Load as image
                  </div>
                )}
              </>
            )}
            {contextMenu.node.type === 'version' && (
              <div
                className="mlflow-context-menu-item"
                onClick={() => handleCopy(contextMenu.node)}
              >
                Copy version
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

