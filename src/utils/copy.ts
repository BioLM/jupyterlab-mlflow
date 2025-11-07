/**
 * Copy to clipboard utilities
 */

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Copy experiment ID
 */
export async function copyExperimentId(experimentId: string): Promise<boolean> {
  return copyToClipboard(experimentId);
}

/**
 * Copy run ID
 */
export async function copyRunId(runId: string): Promise<boolean> {
  return copyToClipboard(runId);
}

/**
 * Copy model name
 */
export async function copyModelName(modelName: string): Promise<boolean> {
  return copyToClipboard(modelName);
}

