import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * Debounces a value by delaying updates until after the specified delay period.
 * Useful for search inputs, API calls, and other scenarios where you want to
 * limit the frequency of updates.
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 * 
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     // Make API call with debouncedSearchTerm
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Create a timer that will update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function that will cancel the timer if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run effect if value or delay changes

  return debouncedValue;
}

/**
 * useDebounceCallback Hook
 * 
 * Creates a debounced version of a callback function.
 * The callback will only be executed after the specified delay period
 * since the last time it was invoked.
 * 
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @param deps - Dependencies array for the callback
 * @returns The debounced callback function
 * 
 * @example
 * ```typescript
 * const debouncedSearch = useDebounceCallback(
 *   (query: string) => {
 *     // API call logic here
 *     searchAPI(query);
 *   },
 *   300,
 *   []
 * );
 * ```
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  };
}

/**
 * useDebounceState Hook
 * 
 * Combines state management with debouncing.
 * Returns both the immediate value and the debounced value,
 * along with a setter function.
 * 
 * @param initialValue - The initial value
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns Object with immediate value, debounced value, and setter
 * 
 * @example
 * ```typescript
 * const { value, debouncedValue, setValue } = useDebounceState('', 300);
 * 
 * // value updates immediately
 * // debouncedValue updates after 300ms delay
 * ```
 */
export function useDebounceState<T>(
  initialValue: T,
  delay: number = 500
): {
  value: T;
  debouncedValue: T;
  setValue: React.Dispatch<React.SetStateAction<T>>;
} {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return {
    value,
    debouncedValue,
    setValue,
  };
}

// Export as default for convenience
export default useDebounce;
