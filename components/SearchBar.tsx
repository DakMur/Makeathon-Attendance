'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { Team } from '@/lib/types';
import { getOptimizedSearchResults } from '@/lib/searchUtils';

interface SearchBarProps {
  teams: Team[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectTeam: (slNo: number) => void;
}

export function SearchBar({
  teams,
  searchQuery,
  onSearchChange,
  onSelectTeam,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute prioritized search results
  const searchResults = useMemo(() => {
    return getOptimizedSearchResults(teams, searchQuery);
  }, [teams, searchQuery]);

  const allFiltered = searchResults.all;

  // Global keyboard shortcut: Cmd+K, Ctrl+K or '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleSelect = (slNo: number) => {
    onSelectTeam(slNo);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onSearchChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (allFiltered.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % allFiltered.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (allFiltered.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + allFiltered.length) % allFiltered.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allFiltered.length > 0 && allFiltered[selectedIndex]) {
        handleSelect(allFiltered[selectedIndex].sl_no);
      }
    } else if (e.key === 'Escape') {
      if (searchQuery) {
        handleClear();
      } else {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  // Helper to highlight matching text
  const renderHighlightedText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="text-blue-600 dark:text-[#3b82f6] font-bold bg-blue-100 dark:bg-[#2563eb]/20 px-0.5 rounded-xs">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-400 dark:text-[#71717a] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (searchQuery.trim()) setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Type a letter (e.g. S, A, T) or Sl# to filter..."
          className="w-full bg-zinc-100 dark:bg-[#121215] border border-zinc-300 dark:border-[#27272a] focus:border-zinc-900 dark:focus:border-white focus:outline-hidden pl-9 pr-14 py-1.5 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#71717a] transition-colors"
        />
        {searchQuery ? (
          <button
            onClick={handleClear}
            className="absolute right-8 text-zinc-400 hover:text-zinc-900 dark:text-[#71717a] dark:hover:text-white p-0.5"
            title="Clear search (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
        <div className="absolute right-2.5 flex items-center gap-0.5 pointer-events-none text-[10px] font-mono text-zinc-500 dark:text-[#71717a] bg-zinc-200 dark:bg-[#1c1c20] px-1 py-0.5 border border-zinc-300 dark:border-[#2e2e34]">
          <span className="text-[9px]">⌘</span>K
        </div>
      </div>

      {/* Instant Dropdown Suggestions with Starts-With / Contains sections */}
      {isOpen && searchQuery.trim() && (
        <div className="absolute left-0 right-0 mt-1 max-h-96 overflow-y-auto bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] shadow-2xl z-50 divide-y divide-zinc-200 dark:divide-[#1f1f23]">
          {allFiltered.length === 0 ? (
            <div className="px-3 py-3 text-xs font-mono text-zinc-500 dark:text-[#71717a] text-center">
              No teams matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <>
              {/* Section 1: Teams Starting With Query */}
              {searchResults.startsWith.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 bg-zinc-100 dark:bg-[#121215] text-[10px] font-mono uppercase tracking-wider text-zinc-700 dark:text-[#a1a1aa] border-b border-zinc-200 dark:border-[#1f1f23] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Starts with &quot;{searchQuery}&quot;
                    </span>
                    <span className="text-zinc-500 dark:text-[#71717a] font-normal">
                      {searchResults.startsWith.length} {searchResults.startsWith.length === 1 ? 'team' : 'teams'}
                    </span>
                  </div>
                  <div>
                    {searchResults.startsWith.map((t) => {
                      const itemIdx = allFiltered.findIndex((item) => item.sl_no === t.sl_no);
                      const isSelected = itemIdx === selectedIndex;
                      return (
                        <button
                          key={t.sl_no}
                          onClick={() => handleSelect(t.sl_no)}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-zinc-100 dark:bg-[#18181b] text-zinc-900 dark:text-white border-l-2 border-l-zinc-900 dark:border-l-white'
                              : 'text-zinc-600 dark:text-[#a1a1aa] hover:bg-zinc-50 dark:hover:bg-[#121215]'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[11px] font-mono font-medium text-zinc-500 dark:text-[#71717a] w-8 shrink-0">
                              #{t.sl_no}
                            </span>
                            <div className="truncate">
                              <span className="text-xs font-mono font-semibold text-zinc-900 dark:text-white">
                                {renderHighlightedText(t.team_name, searchQuery)}
                              </span>
                              <span className="ml-2 text-[11px] text-zinc-500 dark:text-[#71717a] truncate">
                                {[t.member_1, t.member_2, t.member_3, t.member_4]
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CornerDownLeft className="w-3 h-3 text-zinc-400 dark:text-[#71717a] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Teams Containing Query */}
              {searchResults.contains.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 bg-zinc-50 dark:bg-[#101013] text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-[#71717a] border-b border-zinc-200 dark:border-[#1f1f23] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-[#3f3f46]" />
                      Contains &quot;{searchQuery}&quot;
                    </span>
                    <span className="text-zinc-400 dark:text-[#52525b] font-normal">
                      {searchResults.contains.length} {searchResults.contains.length === 1 ? 'team' : 'teams'}
                    </span>
                  </div>
                  <div>
                    {searchResults.contains.map((t) => {
                      const itemIdx = allFiltered.findIndex((item) => item.sl_no === t.sl_no);
                      const isSelected = itemIdx === selectedIndex;
                      return (
                        <button
                          key={t.sl_no}
                          onClick={() => handleSelect(t.sl_no)}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-zinc-100 dark:bg-[#18181b] text-zinc-900 dark:text-white border-l-2 border-l-zinc-900 dark:border-l-white'
                              : 'text-zinc-600 dark:text-[#a1a1aa] hover:bg-zinc-50 dark:hover:bg-[#121215]'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[11px] font-mono font-medium text-zinc-500 dark:text-[#71717a] w-8 shrink-0">
                              #{t.sl_no}
                            </span>
                            <div className="truncate">
                              <span className="text-xs font-mono font-semibold text-zinc-900 dark:text-white">
                                {renderHighlightedText(t.team_name, searchQuery)}
                              </span>
                              <span className="ml-2 text-[11px] text-zinc-500 dark:text-[#71717a] truncate">
                                {[t.member_1, t.member_2, t.member_3, t.member_4]
                                  .filter(Boolean)
                                  .map((name) => renderHighlightedText(name, searchQuery))
                                  .reduce<React.ReactNode[]>((prev, curr, idx) => (idx === 0 ? [curr] : [...prev, ', ', curr]), [])}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CornerDownLeft className="w-3 h-3 text-zinc-400 dark:text-[#71717a] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
