/**
 * Utility functions for formatting display values
 */

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncateId(id: string, maxLength: number = 20): string {
  if (id.length <= maxLength) {
    return id;
  }
  return `${id.substring(0, maxLength - 3)}...`;
}

