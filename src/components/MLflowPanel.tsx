/**
 * Main MLflow panel component
 */

import React, { useState, useEffect } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { LabIcon } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import { MLflowSettings } from '../settings';
import { MLflowClient } from '../mlflow';
import { TreeView } from './TreeView';
import { DetailsView } from './DetailsView';
import { SettingsPanel } from './SettingsPanel';
import { ShortcutsPanel } from './ShortcutsPanel';
import '../../style/index.css';

/**
 * View mode
 */
type ViewMode = 'tree' | 'details' | 'shortcuts';

/**
 * Main MLflow panel props
 */
interface IMLflowPanelProps {
  settings: MLflowSettings;
  mlflowClient: MLflowClient;
  app: JupyterFrontEnd;
}

/**
 * MLflow icon (reused from index.ts)
 */
const mlflowIcon = new LabIcon({
  name: 'jupyterlab-mlflow:icon',
  svgstr: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Mlflow SVG Icon</title><path fill="currentColor" d="M11.883.002a12.044 12.044 0 0 0-9.326 19.463l3.668-2.694A7.573 7.573 0 0 1 12.043 4.45v2.867l6.908-5.14A12 12 0 0 0 11.883.002m9.562 4.533L17.777 7.23a7.573 7.573 0 0 1-5.818 12.322v-2.867l-6.908 5.14a12.046 12.046 0 0 0 16.394-17.29"/></svg>`
});

/**
 * Main MLflow panel component
 */
export function MLflowPanel(props: IMLflowPanelProps): JSX.Element {
  const { settings, mlflowClient, app } = props;
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [showSettings, setShowSettings] = useState(false);
  const [trackingUri, setTrackingUri] = useState<string>('');
  const [detailsSelection, setDetailsSelection] = useState<{ type: 'experiment' | 'run' | 'artifact' | 'model' | 'version'; id: string; data?: any } | null>(null);

  useEffect(() => {
    // Load tracking URI from settings
    settings.getTrackingUri().then(uri => {
      setTrackingUri(uri);
      if (uri) {
        mlflowClient.setTrackingUri(uri);
      } else {
        // Automatically show settings panel if no tracking URI is configured
        setShowSettings(true);
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

  const handleOpenMLflowUI = async () => {
    const uri = trackingUri || await settings.getTrackingUri();
    if (!uri) {
      // Show settings if no URI is configured
      setShowSettings(true);
      return;
    }

    // Construct MLflow UI URL (remove trailing slash if present)
    const mlflowUIUrl = uri.replace(/\/$/, '');
    
    // Create container widget with header bar and iframe
    const container = new Widget();
    container.addClass('mlflow-iframe-container');
    container.node.innerHTML = `
      <div class="mlflow-iframe-header">
        <a href="${mlflowUIUrl}" target="_blank" rel="noopener noreferrer" 
           class="mlflow-pop-out-link" title="Open MLflow UI in new browser tab">
          🔗 Open in new tab
        </a>
      </div>
      <iframe src="${mlflowUIUrl}" 
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              class="mlflow-iframe"
              referrerpolicy="no-referrer">
      </iframe>
    `;

    // Create main area widget
    const mainWidget = new MainAreaWidget({ content: container });
    mainWidget.id = 'mlflow-ui-widget';
    mainWidget.title.label = 'MLflow UI';
    mainWidget.title.icon = mlflowIcon;
    mainWidget.title.closable = true;

    // Add to main area
    app.shell.add(mainWidget, 'main', { activate: true });
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
            className={`mlflow-button ${viewMode === 'details' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('details');
              setDetailsSelection(null);
            }}
            title="Details View"
          >
            📋
          </button>
          <button
            className={`mlflow-button ${viewMode === 'shortcuts' ? 'active' : ''}`}
            onClick={() => setViewMode('shortcuts')}
            title="MLflow Shortcuts"
          >
            ⚡
          </button>
          <button
            className="mlflow-button"
            onClick={handleOpenMLflowUI}
            title="Open MLflow UI in new tab"
          >
            🌐
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
          <TreeView 
            mlflowClient={mlflowClient} 
            onOpenObject={(type, id, data) => {
              setViewMode('details');
              setDetailsSelection({ type, id, data });
            }}
          />
        ) : viewMode === 'details' ? (
          <DetailsView 
            mlflowClient={mlflowClient}
            app={app}
            initialSelection={detailsSelection || undefined}
            onObjectSelect={(type, id) => {
              if (type) {
                setDetailsSelection({ type, id });
              }
            }}
          />
        ) : (
          <ShortcutsPanel app={app} />
        )}
      </div>
    </div>
  );
}

