/* eslint-disable */
/**
 * JupyterLab MLflow Extension
 * This file loads the extension via module federation for JupyterLab 4.x
 */
import { PageConfig } from '@jupyterlab/coreutils';

async function activate(app, registry, translator, palette, mainMenu) {
  // Load package.json to get the remoteEntry filename
  const packageJson = require('./package.json');
  const remoteEntry = packageJson.jupyterlab?._build?.load || 'static/remoteEntry.399f068a88df455f73db.js';
  const baseUrl = PageConfig.getOption('fullLabextensionsUrl') || PageConfig.getOption('baseUrl');
  const remoteEntryUrl = `${baseUrl}/labextensions/jupyterlab-mlflow/${remoteEntry}`;
  
  const { default: extension } = await import(/* webpackChunkName: "jupyterlab-mlflow" */ remoteEntryUrl);
  return extension.activate(app, registry, translator, palette, mainMenu);
}

const plugin = {
  id: 'jupyterlab-mlflow:plugin',
  autoStart: true,
  requires: ['@jupyterlab/settingregistry', '@jupyterlab/translation'],
  optional: ['@jupyterlab/apputils', '@jupyterlab/mainmenu'],
  activate
};

export default plugin;
