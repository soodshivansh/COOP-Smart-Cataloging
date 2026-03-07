'use client';

import { useState, useCallback } from 'react';
import { debounce } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  // Debounce search to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value);
    }, 300),
    [onSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search products..."
        className="w-full px-4 py-3 pl-12 pr-12 bg-background-secondary border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
      />
      
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {query && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
