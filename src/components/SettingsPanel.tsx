/**
 * Settings panel component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MLflowSettings } from '../settings';
import { MLflowClient, IConnectionTestResponse, ILocalMLflowServerStatus } from '../mlflow';

/**
 * Settings panel props
 */
interface ISettingsPanelProps {
  settings: MLflowSettings;
  mlflowClient: MLflowClient;
  trackingUri: string;
  onTrackingUriChange: (uri: string) => void;
  onClose: () => void;
}

/**
 * Settings panel component
 */
export function SettingsPanel(props: ISettingsPanelProps): JSX.Element {
  const { mlflowClient, trackingUri, onTrackingUriChange, onClose } = props;
  const [localUri, setLocalUri] = useState(trackingUri);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<IConnectionTestResponse | null>(null);
  
  // Local server state
  const [localServerStatus, setLocalServerStatus] = useState<ILocalMLflowServerStatus | null>(null);
  const [localServerPort, setLocalServerPort] = useState(5000);
  const [localServerTrackingUri, setLocalServerTrackingUri] = useState('sqlite:///mlflow.db');
  const [localServerArtifactUri, setLocalServerArtifactUri] = useState('./mlruns');
  const [localServerStarting, setLocalServerStarting] = useState(false);
  const [localServerStopping, setLocalServerStopping] = useState(false);
  
  // Load local server status function
  const loadLocalServerStatus = useCallback(async () => {
    try {
      const status = await mlflowClient.getLocalServerStatus();
      setLocalServerStatus(status);
      // If server is running, update the tracking URI field
      if (status.running && status.url) {
        setLocalUri(status.url);
      }
    } catch (error) {
      console.error('Failed to load local server status:', error);
    }
  }, [mlflowClient]);
  
  // Load local server status on mount
  useEffect(() => {
    loadLocalServerStatus();
    // Poll status every 5 seconds
    const interval = setInterval(loadLocalServerStatus, 5000);
    return () => clearInterval(interval);
  }, [loadLocalServerStatus]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await mlflowClient.testConnection(localUri);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onTrackingUriChange(localUri);
    onClose();
  };

  const handleStartLocalServer = async () => {
    setLocalServerStarting(true);
    try {
      const result = await mlflowClient.startLocalServer(
        localServerPort,
        localServerTrackingUri,
        localServerArtifactUri
      );
      if (result.success && result.url) {
        setLocalUri(result.url);
        onTrackingUriChange(result.url);
      }
      await loadLocalServerStatus();
    } catch (error) {
      console.error('Failed to start local server:', error);
      alert(`Failed to start local MLflow server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLocalServerStarting(false);
    }
  };

  const handleStopLocalServer = async () => {
    setLocalServerStopping(true);
    try {
      await mlflowClient.stopLocalServer();
      await loadLocalServerStatus();
    } catch (error) {
      console.error('Failed to stop local server:', error);
      alert(`Failed to stop local MLflow server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLocalServerStopping(false);
    }
  };

  return (
    <div className="mlflow-settings-panel">
      <div className="mlflow-settings-header">
        <h3>MLflow Settings</h3>
        <button className="mlflow-button-close" onClick={onClose}>×</button>
      </div>
      
      <div className="mlflow-settings-content">
        <div className="mlflow-settings-field">
          <label htmlFor="tracking-uri">MLflow Tracking URI</label>
          <input
            id="tracking-uri"
            type="text"
            value={localUri}
            onChange={(e) => setLocalUri(e.target.value)}
            placeholder="http://localhost:5000 or leave empty for MLFLOW_TRACKING_URI env var"
            className="mlflow-input"
          />
          <div className="mlflow-settings-help">
            Leave empty to use MLFLOW_TRACKING_URI environment variable
          </div>
        </div>

        <div className="mlflow-settings-actions">
          <button
            className="mlflow-button mlflow-button-primary"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          
          {testResult && (
            <div className={`mlflow-test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.success ? (
                <span>✓ {testResult.message || 'Connection successful'}</span>
              ) : (
                <span>✗ {testResult.error || 'Connection failed'}</span>
              )}
            </div>
          )}
        </div>

        <div className="mlflow-settings-actions">
          <button
            className="mlflow-button mlflow-button-primary"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="mlflow-button"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

        <div className="mlflow-settings-divider"></div>

        <div className="mlflow-settings-section">
          <h4 className="mlflow-settings-section-title">Local MLflow Server</h4>
          <div className="mlflow-settings-help" style={{ marginBottom: '12px' }}>
            Launch a local MLflow server for development and testing
          </div>

          {localServerStatus?.running && (
            <div className="mlflow-test-result success" style={{ marginBottom: '12px' }}>
              ✓ MLflow server running on {localServerStatus.url}
            </div>
          )}

          <div className="mlflow-settings-field">
            <label htmlFor="local-server-port">Port</label>
            <input
              id="local-server-port"
              type="number"
              value={localServerPort}
              onChange={(e) => setLocalServerPort(parseInt(e.target.value) || 5000)}
              className="mlflow-input"
              disabled={localServerStatus?.running}
            />
          </div>

          <div className="mlflow-settings-field">
            <label htmlFor="local-server-tracking-uri">Tracking URI</label>
            <input
              id="local-server-tracking-uri"
              type="text"
              value={localServerTrackingUri}
              onChange={(e) => setLocalServerTrackingUri(e.target.value)}
              placeholder="sqlite:///mlflow.db"
              className="mlflow-input"
              disabled={localServerStatus?.running}
            />
            <div className="mlflow-settings-help">
              Default: sqlite:///mlflow.db (SQLite database)
            </div>
          </div>

          <div className="mlflow-settings-field">
            <label htmlFor="local-server-artifact-uri">Artifact URI</label>
            <input
              id="local-server-artifact-uri"
              type="text"
              value={localServerArtifactUri}
              onChange={(e) => setLocalServerArtifactUri(e.target.value)}
              placeholder="./mlruns"
              className="mlflow-input"
              disabled={localServerStatus?.running}
            />
            <div className="mlflow-settings-help">
              Default: ./mlruns (local directory)
            </div>
          </div>

          <div className="mlflow-settings-actions">
            {localServerStatus?.running ? (
              <button
                className="mlflow-button"
                onClick={handleStopLocalServer}
                disabled={localServerStopping}
              >
                {localServerStopping ? 'Stopping...' : 'Stop Server'}
              </button>
            ) : (
              <button
                className="mlflow-button mlflow-button-primary"
                onClick={handleStartLocalServer}
                disabled={localServerStarting}
              >
                {localServerStarting ? 'Starting...' : 'Start Local Server'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

