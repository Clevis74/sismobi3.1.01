import { useState, /* useEffect */ } from 'react'; // useEffect not used in current implementation

// Helper function to convert date strings back to Date objects
function reviveDates(key: string, value: any): any {
  // Define which keys should be converted to dates
  const dateFields = ['createdAt', 'startDate', 'agreedPaymentDate', 'date', 'nextDate', 'issueDate', 'validityDate', 'lastUpdated'];
  
  if (typeof value === 'string' && dateFields.includes(key)) {
    const date = new Date(value);
    // Check if it's a valid date
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return value;
}

// Helper function to recursively process objects and arrays
function processStoredData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => processStoredData(item));
  }
  
  if (typeof data === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(data)) {
      processed[key] = reviveDates(key, processStoredData(value));
    }
    return processed;
  }
  
  return data;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Process the parsed data to convert date strings back to Date objects
        return processStoredData(parsed);
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}