// src/store/slices/theme-slice.js
import { persist } from 'zustand/middleware';

export const createThemeSlice = (set, get) => ({
  theme: 'dark', // Default theme
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'dark' ? 'light' : 'dark',
  })),
});