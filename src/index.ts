/**
 * JupyterLab MLflow Extension
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ITranslator } from '@jupyterlab/translation';
import { ServerConnection } from '@jupyterlab/services';
import { LabIcon } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';

import { MLflowWidget } from './widget';
import { MLflowSettings } from './settings';
import { MLflowClient } from './mlflow';

/**
 * The command IDs used by the MLflow plugin.
 */
namespace CommandIDs {
  export const open = 'mlflow:open';
  export const toggle = 'mlflow:toggle';
  export const openUI = 'mlflow:open-ui';
}

/**
 * MLflow icon
 */
const mlflowIcon = new LabIcon({
  name: 'jupyterlab-mlflow:icon',
  svgstr: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Mlflow SVG Icon</title><path fill="currentColor" d="M11.883.002a12.044 12.044 0 0 0-9.326 19.463l3.668-2.694A7.573 7.573 0 0 1 12.043 4.45v2.867l6.908-5.14A12 12 0 0 0 11.883.002m9.562 4.533L17.777 7.23a7.573 7.573 0 0 1-5.818 12.322v-2.867l-6.908 5.14a12.046 12.046 0 0 0 16.394-17.29"/></svg>`
});

/**
 * Initialization data for the jupyterlab-mlflow extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-mlflow:plugin',
  autoStart: true,
  requires: [ISettingRegistry, ITranslator],
  optional: [ICommandPalette, IMainMenu],
  activate: async (
    app: JupyterFrontEnd,
    registry: ISettingRegistry,
    translator: ITranslator,
    palette: ICommandPalette | null,
    mainMenu: IMainMenu | null
  ) => {
    console.log('JupyterLab extension jupyterlab-mlflow is activated!');

    // Initialize settings
    const settings = new MLflowSettings(registry, translator);
    await settings.initialize();

    // Initialize MLflow client
    const serverSettings = ServerConnection.makeSettings();
    const mlflowClient = new MLflowClient(serverSettings);

    // Get tracking URI from settings
    const trackingUri = await settings.getTrackingUri();
    if (trackingUri) {
      mlflowClient.setTrackingUri(trackingUri);
    }

    // Create widget
    const widget = new MLflowWidget(settings, mlflowClient, app);
    widget.id = 'mlflow-widget';
    widget.title.icon = mlflowIcon;

    // Add to left sidebar
    app.shell.add(widget, 'left', { rank: 1000 });

    // Add commands
    const { commands } = app;

    commands.addCommand(CommandIDs.open, {
      label: 'Open MLflow',
      execute: () => {
        if (!widget.isAttached) {
          app.shell.add(widget, 'left', { rank: 1000 });
        }
        app.shell.activateById(widget.id);
      }
    });

    commands.addCommand(CommandIDs.toggle, {
      label: 'Toggle MLflow',
      execute: () => {
        if (widget.isAttached) {
          widget.dispose();
        } else {
          app.shell.add(widget, 'left', { rank: 1000 });
          app.shell.activateById(widget.id);
        }
      }
    });

    commands.addCommand(CommandIDs.openUI, {
      label: 'Open MLflow UI',
      execute: async () => {
        const trackingUri = await settings.getTrackingUri();
        if (!trackingUri) {
          // Show settings if no URI is configured
          if (!widget.isAttached) {
            app.shell.add(widget, 'left', { rank: 1000 });
          }
          app.shell.activateById(widget.id);
          // Could trigger settings panel here
          return;
        }

        // Construct MLflow UI URL
        const mlflowUIUrl = trackingUri.replace(/\/$/, '');
        
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
      }
    });

    // Add to command palette
    if (palette) {
      palette.addItem({
        command: CommandIDs.open,
        category: 'MLflow'
      });
      palette.addItem({
        command: CommandIDs.openUI,
        category: 'MLflow'
      });
    }

    // Add to menu
    if (mainMenu) {
      mainMenu.viewMenu.addGroup([
        { command: CommandIDs.toggle }
      ]);
    }
  }
};

export default plugin;

