import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { t } from '../../i18n';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/' or 'Cmd+K' / 'Ctrl+K'
      if (
        (e.key === '/' || (e.metaKey && e.key.toLowerCase() === 'k') || (e.ctrlKey && e.key.toLowerCase() === 'k')) &&
        document.activeElement !== inputRef.current
      ) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) return;
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Escape behavior: first clear input, or blur if already empty
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        if (value) {
          onChange('');
        } else {
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value, onChange]);

  return (
    <div className={`relative w-full ${className}`} role="search">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
        <Search className="w-5 h-5 text-cyan-400 transition-colors" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        placeholder={placeholder || t('common.searchPlaceholder')}
        id="global-tool-search-input"
        className="w-full pl-11 pr-12 py-3 rounded-full bg-white/5 border border-white/15 text-sm text-slate-100 placeholder-slate-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all shadow-lg shadow-black/20 focus:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
        aria-label="Search utilities"
      />

      {value ? (
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none gap-1">
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded-md shadow-sm">
            /
          </kbd>
        </div>
      )}
    </div>
  );
};

