/**
 * MLflow API client for communicating with backend
 */

import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

/**
 * MLflow experiment
 */
export interface IExperiment {
  experiment_id: string;
  name: string;
  artifact_location: string;
  lifecycle_stage: string;
  tags: { [key: string]: string };
}

/**
 * MLflow run
 */
export interface IRun {
  run_id: string;
  run_name: string;
  experiment_id: string;
  status: string;
  start_time: number;
  end_time: number | null;
  user_id: string;
  metrics: { [key: string]: number };
  params: { [key: string]: string };
  tags: { [key: string]: string };
  artifact_uri: string;
}

/**
 * MLflow artifact
 */
export interface IArtifact {
  path: string;
  is_dir: boolean;
  file_size: number | null;
}

/**
 * MLflow model version
 */
export interface IModelVersion {
  version: string;
  stage: string;
  status: string;
  run_id: string;
  creation_timestamp: number;
  description?: string;
}

/**
 * MLflow registered model
 */
export interface IModel {
  name: string;
  latest_versions: IModelVersion[];
  creation_timestamp: number;
  last_updated_timestamp: number;
  description?: string;
  tags: { [key: string]: string };
}

/**
 * API response types
 */
export interface IExperimentsResponse {
  experiments: IExperiment[];
}

export interface IRunsResponse {
  runs: IRun[];
}

export interface IArtifactsResponse {
  run_id: string;
  artifact_uri: string;
  artifacts: IArtifact[];
}

export interface IModelsResponse {
  models: IModel[];
}

export interface IConnectionTestResponse {
  success: boolean;
  message?: string;
  error?: string;
  experiment_count?: number;
}

export interface ILocalMLflowServerStatus {
  running: boolean;
  port?: number;
  url?: string;
  tracking_uri?: string;
  artifact_uri?: string;
  message?: string;
  error?: string;
  success?: boolean;
}

/**
 * MLflow API client
 */
export class MLflowClient {
  private _serverSettings: ServerConnection.ISettings;
  private _trackingUri: string = '';

  constructor(serverSettings?: ServerConnection.ISettings) {
    this._serverSettings = serverSettings || ServerConnection.makeSettings();
  }

  /**
   * Set tracking URI
   */
  setTrackingUri(uri: string): void {
    this._trackingUri = uri;
  }

  /**
   * Get base URL for constructing download links
   */
  getBaseUrl(): string {
    return this._serverSettings.baseUrl;
  }

  /**
   * Get server settings for use with JupyterLab services
   */
  getServerSettings(): ServerConnection.ISettings {
    return this._serverSettings;
  }

  /**
   * Get base API URL
   */
  private getApiUrl(endpoint: string): string {
    const baseUrl = this._serverSettings.baseUrl;
    const url = URLExt.join(baseUrl, 'mlflow', 'api', endpoint);
    
    if (this._trackingUri) {
      // Check if URL already has query parameters
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}tracking_uri=${encodeURIComponent(this._trackingUri)}`;
    }
    
    return url;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.getApiUrl(endpoint);
    
    const response = await ServerConnection.makeRequest(
      url,
      {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json'
        }
      },
      this._serverSettings
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test connection to MLflow server
   */
  async testConnection(trackingUri: string): Promise<IConnectionTestResponse> {
    const url = this.getApiUrl('connection/test');
    const response = await ServerConnection.makeRequest(
      url,
      {
        method: 'POST',
        body: JSON.stringify({ tracking_uri: trackingUri }),
        headers: {
          'Content-Type': 'application/json'
        }
      },
      this._serverSettings
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return response.json();
  }

  /**
   * Get list of experiments
   */
  async getExperiments(): Promise<IExperiment[]> {
    const response = await this.request<IExperimentsResponse>('experiments');
    return response.experiments;
  }

  /**
   * Get experiment details
   */
  async getExperiment(experimentId: string): Promise<IExperiment> {
    return this.request<IExperiment>(`experiments/${experimentId}`);
  }

  /**
   * Get runs for an experiment
   */
  async getRuns(experimentId: string): Promise<IRun[]> {
    const response = await this.request<IRunsResponse>(`experiments/${experimentId}/runs`);
    return response.runs;
  }

  /**
   * Get run details
   */
  async getRun(runId: string): Promise<IRun> {
    return this.request<IRun>(`runs/${runId}`);
  }

  /**
   * Get artifacts for a run
   */
  async getArtifacts(runId: string, path?: string): Promise<IArtifactsResponse> {
    const url = path 
      ? `runs/${runId}/artifacts?path=${encodeURIComponent(path)}`
      : `runs/${runId}/artifacts`;
    return this.request<IArtifactsResponse>(url);
  }

  /**
   * Download artifact
   */
  async downloadArtifact(runId: string, path: string): Promise<Blob> {
    const url = this.getApiUrl(`runs/${runId}/artifacts/download?path=${encodeURIComponent(path)}`);
    
    console.log('Downloading artifact from URL:', url);
    
    const response = await ServerConnection.makeRequest(
      url,
      {},
      this._serverSettings
    );

    console.log('Download response status:', response.status, response.statusText);
    console.log('Download response headers:', response.headers);

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (e2) {
          // Ignore
        }
      }
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    const blob = await response.blob();
    console.log('Downloaded blob size:', blob.size, 'type:', blob.type);
    
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    return blob;
  }

  /**
   * Get list of registered models
   */
  async getModels(): Promise<IModel[]> {
    const response = await this.request<IModelsResponse>('models');
    return response.models;
  }

  /**
   * Get model details
   */
  async getModel(modelName: string): Promise<IModel> {
    return this.request<IModel>(`models/${encodeURIComponent(modelName)}`);
  }

  /**
   * Get local MLflow server status
   */
  async getLocalServerStatus(): Promise<ILocalMLflowServerStatus> {
    return this.request<ILocalMLflowServerStatus>('local-server');
  }

  /**
   * Start local MLflow server
   */
  async startLocalServer(
    port: number = 5000,
    trackingUri: string = 'sqlite:///mlflow.db',
    artifactUri?: string,
    backendUri?: string
  ): Promise<ILocalMLflowServerStatus> {
    const url = this.getApiUrl('local-server');
    const body = JSON.stringify({
      port,
      tracking_uri: trackingUri,
      artifact_uri: artifactUri,
      backend_uri: backendUri
    });

    const response = await ServerConnection.makeRequest(
      url,
      {
        method: 'POST',
        body
      },
      this._serverSettings
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Stop local MLflow server
   */
  async stopLocalServer(): Promise<ILocalMLflowServerStatus> {
    const url = this.getApiUrl('local-server');

    const response = await ServerConnection.makeRequest(
      url,
      {
        method: 'DELETE'
      },
      this._serverSettings
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

