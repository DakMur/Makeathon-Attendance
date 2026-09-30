'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      id="theme-toggle-btn"
      type="button"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#18181b] dark:bg-[#18181b] light:bg-[#f1f5f9] text-xs font-mono font-medium text-[#a1a1aa] dark:text-[#a1a1aa] hover:text-white dark:hover:text-white light:text-[#475569] light:hover:text-[#09090b] border border-[#27272a] dark:border-[#27272a] light:border-[#e2e8f0] transition-colors rounded-sm"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle dark/light theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}
