/**
 * Settings manager for MLflow extension
 */

import {
  ISettingRegistry
} from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';

/**
 * MLflow extension settings
 */
export interface IMLflowSettings {
  mlflowTrackingUri: string;
}

/**
 * Settings manager class
 */
export class MLflowSettings {
  private _settings: ISettingRegistry.ISettings | null = null;

  constructor(
    private _registry: ISettingRegistry,
    translator?: ITranslator
  ) {
  }

  /**
   * Initialize settings
   */
  async initialize(): Promise<void> {
    const pluginId = 'jupyterlab-mlflow:plugin';
    
    try {
      this._settings = await this._registry.load(pluginId);
    } catch (error) {
      console.error(`Failed to load settings for ${pluginId}:`, error);
    }
  }

  /**
   * Get MLflow tracking URI from settings or environment
   */
  async getTrackingUri(): Promise<string> {
    // First try settings
    if (this._settings) {
      const uri = this._settings.get('mlflowTrackingUri').composite as string;
      if (uri && uri.trim() !== '') {
        return uri.trim();
      }
    }

    // Fallback to environment variable (will be fetched from backend)
    return '';
  }

  /**
   * Set MLflow tracking URI
   */
  async setTrackingUri(uri: string): Promise<void> {
    if (!this._settings) {
      throw new Error('Settings not initialized');
    }

    await this._settings.set('mlflowTrackingUri', uri);
  }

  /**
   * Get all settings
   */
  getSettings(): IMLflowSettings {
    if (!this._settings) {
      return {
        mlflowTrackingUri: ''
      };
    }

    return {
      mlflowTrackingUri: this._settings.get('mlflowTrackingUri').composite as string
    };
  }

  /**
   * Check if settings are loaded
   */
  get isLoaded(): boolean {
    return this._settings !== null;
  }
}

