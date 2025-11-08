/* eslint-disable */
/**
 * JupyterLab MLflow Extension
 * This file loads the extension via module federation for JupyterLab 4.x
 */
import { PageConfig } from '@jupyterlab/coreutils';

async function activate(app, registry, translator, palette, mainMenu) {
  // The remoteEntry filename is set in package.json._build.load during build
  // For JupyterLab 4.x, we need to construct the URL dynamically
  const baseUrl = PageConfig.getOption('fullLabextensionsUrl') || PageConfig.getOption('baseUrl') || '';
  // Try to read the remoteEntry from package.json, fallback to pattern matching
  let remoteEntry = 'static/remoteEntry.js'; // Default fallback
  try {
    const response = await fetch(`${baseUrl}/labextensions/jupyterlab-mlflow/package.json`);
    if (response.ok) {
      const pkg = await response.json();
      remoteEntry = pkg.jupyterlab?._build?.load || remoteEntry;
    }
  } catch (e) {
    // Fallback to default if we can't read package.json
    console.warn('Could not read package.json, using default remoteEntry:', e);
  }
  
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


