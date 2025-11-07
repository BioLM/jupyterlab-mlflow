/**
 * Artifact viewer utilities
 */

import { MLflowClient } from '../mlflow';

/**
 * Open artifact in new JupyterLab tab
 */
export async function openArtifact(
  runId: string,
  artifactPath: string,
  mlflowClient: MLflowClient
): Promise<void> {
  try {
    // Download artifact
    const blob = await mlflowClient.downloadArtifact(runId, artifactPath);
    
    // Determine file type from extension
    const extension = artifactPath.split('.').pop()?.toLowerCase() || '';
    const fileName = artifactPath.split('/').pop() || `artifact_${runId}`;
    
    // Create a temporary file object URL
    const url = URL.createObjectURL(blob);
    
    // For images, JSON, CSV, and text files, we can create a document
    // In a real implementation, you would use JupyterLab's document manager
    // For now, we'll open in a new window/tab
    
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(extension)) {
      // Open image in new window
      const imgWindow = window.open('', '_blank');
      if (imgWindow) {
        imgWindow.document.write(`
          <html>
            <head><title>${fileName}</title></head>
            <body style="margin:0;padding:20px;text-align:center;">
              <img src="${url}" style="max-width:100%;height:auto;" />
            </body>
          </html>
        `);
      }
    } else if (extension === 'json') {
      // Open JSON in new window with syntax highlighting
      const text = await blob.text();
      const jsonWindow = window.open('', '_blank');
      if (jsonWindow) {
        jsonWindow.document.write(`
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body { font-family: monospace; padding: 20px; background: #f5f5f5; }
                pre { background: white; padding: 15px; border-radius: 5px; overflow: auto; }
              </style>
            </head>
            <body>
              <h2>${fileName}</h2>
              <pre>${JSON.stringify(JSON.parse(text), null, 2)}</pre>
            </body>
          </html>
        `);
      }
    } else if (extension === 'csv') {
      // Open CSV in new window as table
      const text = await blob.text();
      const csvWindow = window.open('', '_blank');
      if (csvWindow) {
        const rows = text.split('\n').map(row => {
          const cells = row.split(',');
          return '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
        }).join('');
        csvWindow.document.write(`
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body { font-family: sans-serif; padding: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              <h2>${fileName}</h2>
              <table>${rows}</table>
            </body>
          </html>
        `);
      }
    } else {
      // Open as text
      const text = await blob.text();
      const textWindow = window.open('', '_blank');
      if (textWindow) {
        textWindow.document.write(`
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body { font-family: monospace; padding: 20px; white-space: pre-wrap; }
              </style>
            </head>
            <body>${text}</body>
          </html>
        `);
      }
    }
    
    // Clean up object URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Failed to open artifact:', error);
    alert(`Failed to open artifact: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

