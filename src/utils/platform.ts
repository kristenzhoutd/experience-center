/**
 * Platform detection utilities
 */
export function isMac(): boolean {
  return window.aiSuites?.platform === 'darwin';
}

export function isWindows(): boolean {
  return window.aiSuites?.platform === 'win32';
}
