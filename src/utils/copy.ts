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
 * Copy code snippet to clipboard with notification
 */
export async function copyCode(code: string): Promise<void> {
  const success = await copyToClipboard(code);
  if (success) {
    showNotification('Code copied to clipboard!');
  } else {
    showNotification('Failed to copy code', 'error');
  }
}

/**
 * Simple toast notification
 */
function showNotification(message: string, type: 'success' | 'error' = 'success'): void {
  // Remove any existing toast
  const existing = document.querySelector('.mlflow-toast');
  if (existing) {
    existing.remove();
  }

  // Create a simple toast notification
  const toast = document.createElement('div');
  toast.className = 'mlflow-toast';
  toast.textContent = message;
  
  const bgColor = type === 'success' 
    ? 'var(--jp-success-color1, #4caf50)' 
    : 'var(--jp-error-color1, #f44336)';
  
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10000;
    font-size: 13px;
    animation: mlflow-slideIn 0.3s ease-out;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'mlflow-slideOut 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2000);
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

