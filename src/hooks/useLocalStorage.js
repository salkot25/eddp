import { useState, useEffect } from "react";

/**
 * Custom hook untuk mengelola state yang tersinkronisasi dengan localStorage
 */
export function useLocalStorage(key, initialValue) {
  // Ambil data awal dari localStorage jika tersedia
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Perbarui localStorage setiap kali storedValue berubah
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
