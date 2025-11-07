/**
 * Main MLflow widget component
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Widget } from '@lumino/widgets';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { MLflowSettings } from './settings';
import { MLflowClient } from './mlflow';
import { MLflowPanel } from './components/MLflowPanel';

/**
 * MLflow sidebar widget
 */
export class MLflowWidget extends Widget {
  private _settings: MLflowSettings;
  private _mlflowClient: MLflowClient;
  private _app: JupyterFrontEnd;

  constructor(settings: MLflowSettings, mlflowClient: MLflowClient, app: JupyterFrontEnd) {
    super();
    this._settings = settings;
    this._mlflowClient = mlflowClient;
    this._app = app;
    this.addClass('mlflow-widget');
    this.id = 'mlflow-widget';
    this.title.closable = true;
  }

  /**
   * Called when the widget is attached to the DOM
   */
  onAfterAttach(): void {
    this._render();
  }

  /**
   * Called when the widget is detached from the DOM
   */
  onBeforeDetach(): void {
    ReactDOM.unmountComponentAtNode(this.node);
  }

  /**
   * Render the React component
   */
  private _render(): void {
    ReactDOM.render(
      <MLflowPanel
        settings={this._settings}
        mlflowClient={this._mlflowClient}
        app={this._app}
      />,
      this.node
    );
  }
}

