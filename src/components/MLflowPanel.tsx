/**
 * Main MLflow panel component
 */

import React, { useState, useEffect } from 'react';
import { MLflowSettings } from '../settings';
import { MLflowClient } from '../mlflow';
import { TreeView } from './TreeView';
import { ListView } from './ListView';
import { SettingsPanel } from './SettingsPanel';
import '../../style/index.css';

/**
 * View mode
 */
type ViewMode = 'tree' | 'list';

/**
 * Main MLflow panel props
 */
interface IMLflowPanelProps {
  settings: MLflowSettings;
  mlflowClient: MLflowClient;
}

/**
 * Main MLflow panel component
 */
export function MLflowPanel(props: IMLflowPanelProps): JSX.Element {
  const { settings, mlflowClient } = props;
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [showSettings, setShowSettings] = useState(false);
  const [trackingUri, setTrackingUri] = useState<string>('');

  useEffect(() => {
    // Load tracking URI from settings
    settings.getTrackingUri().then(uri => {
      setTrackingUri(uri);
      if (uri) {
        mlflowClient.setTrackingUri(uri);
      }
    });
  }, [settings, mlflowClient]);

  const handleSettingsChange = async (newUri: string) => {
    setTrackingUri(newUri);
    if (newUri) {
      mlflowClient.setTrackingUri(newUri);
    }
    await settings.setTrackingUri(newUri);
  };

  return (
    <div className="mlflow-panel">
      <div className="mlflow-panel-header">
        <div className="mlflow-panel-title">MLflow</div>
        <div className="mlflow-panel-controls">
          <button
            className={`mlflow-button ${viewMode === 'tree' ? 'active' : ''}`}
            onClick={() => setViewMode('tree')}
            title="Tree View"
          >
            📁
          </button>
          <button
            className={`mlflow-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            📋
          </button>
          <button
            className="mlflow-button"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
      
      {showSettings && (
        <div className="mlflow-settings-container">
          <SettingsPanel
            settings={settings}
            mlflowClient={mlflowClient}
            trackingUri={trackingUri}
            onTrackingUriChange={handleSettingsChange}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}

      <div className="mlflow-panel-content">
        {viewMode === 'tree' ? (
          <TreeView mlflowClient={mlflowClient} />
        ) : (
          <ListView mlflowClient={mlflowClient} />
        )}
      </div>
    </div>
  );
}

