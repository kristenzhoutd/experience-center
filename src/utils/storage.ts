// Browser storage wrapper using sessionStorage
// All user data auto-clears when the tab closes (privacy by architecture)
export const storage = {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // sessionStorage full or unavailable
    }
  },
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
