/**
 * Save data to localStorage
 * @param key - Storage key
 * @param data - Data to store (will be JSON stringified)
 */
export function save(key: string, data: unknown): void {
  if (typeof window === 'undefined') return; // Skip on server-side
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

/**
 * Load data from localStorage
 * @param key - Storage key
 * @returns Parsed data or null if not found/invalid
 */
export function load<T>(key: string): T | null {
  if (typeof window === 'undefined') return null; // Skip on server-side
  
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Remove data from localStorage
 * @param key - Storage key
 */
export function remove(key: string): void {
  if (typeof window === 'undefined') return; // Skip on server-side
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
}

/**
 * Clear all localStorage data (use with caution)
 */
export function clear(): void {
  if (typeof window === 'undefined') return; // Skip on server-side
  
  try {
    localStorage.clear();
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}

/**
 * Check if localStorage is available
 * @returns True if localStorage is available and functional
 */
export function isAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__dmsa_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Storage keys for the DMA application
export const StorageKeys = {
  ASSESSMENT_ANSWERS: 'dmsa-assessment-answers',
  ASSESSMENT_SPEC: 'dmsa-assessment-spec',
  LANGUAGE_PREFERENCE: 'dmsa-language',
  USER_PREFERENCES: 'dmsa-user-preferences',
} as const;