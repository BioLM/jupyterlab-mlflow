/**
 * Settings panel component
 */

import React, { useState } from 'react';
import { MLflowSettings } from '../settings';
import { MLflowClient, IConnectionTestResponse } from '../mlflow';

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
      </div>
    </div>
  );
}

