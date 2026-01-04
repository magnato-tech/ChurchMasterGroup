
import React, { useState, useEffect, useRef } from 'react';
import { Person } from '../types';

interface PersonSelectorProps {
  people: Person[];
  onSelect: (personId: string) => void;
  placeholder?: string;
  excludeIds?: string[];
  className?: string;
}

export const PersonSelector: React.FC<PersonSelectorProps> = ({ 
  people, 
  onSelect, 
  placeholder = "Søk etter person...", 
  excludeIds = [],
  className = ""
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = people.filter(p => 
    !excludeIds.includes(p.id) && 
    (p.fullName.toLowerCase().includes(search.toLowerCase()) || 
     p.email.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
      </div>

      {isOpen && (search.length > 0 || filtered.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto animate-in zoom-in-95 duration-150">
          {filtered.length > 0 ? filtered.map(person => (
            <button
              key={person.id}
              onClick={() => {
                onSelect(person.id);
                setSearch('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">{person.fullName}</p>
                <p className="text-xs text-slate-500">{person.email}</p>
              </div>
              <span className="text-[10px] font-black uppercase text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Velg</span>
            </button>
          )) : (
            <div className="px-4 py-6 text-center text-slate-400 text-sm">
              Ingen treff på "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
