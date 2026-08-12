import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Client } from '../types';

export interface SectorFilterState {
  authority: 'All' | 'State' | 'Center';
  selectedSectors: string[];
}

export const filterClientsBySectorJurisdiction = (
  clients: Client[],
  authority: 'All' | 'State' | 'Center',
  selectedSectors: string[]
): Client[] => {
  if (!clients) return [];
  return clients.filter(c => {
    if (!c || !c.gstProfile) return false;

    // 1. Authority check
    const clientAuth: 'State' | 'Center' = c.gstProfile.jurisdictionType || (c.gstProfile.range && !c.gstProfile.sector ? 'Center' : 'State');
    if (authority !== 'All' && clientAuth !== authority) {
      return false;
    }

    // 2. Sector / Range check
    if (!selectedSectors || selectedSectors.length === 0) {
      return true;
    }

    const clientSector = (c.gstProfile.sector || c.gstProfile.range || '').trim();
    if (!clientSector) return false;

    const clientLower = clientSector.toLowerCase();
    const clientNum = clientLower.replace(/[^0-9]/g, '');

    return selectedSectors.some(sel => {
      const selLower = sel.trim().toLowerCase();
      if (!selLower) return true;
      if (clientLower === selLower) return true;

      const selNum = selLower.replace(/[^0-9]/g, '');
      if (clientNum && selNum && clientNum === selNum) {
        return true;
      }
      return clientLower.includes(selLower) || selLower.includes(clientLower);
    });
  });
};

interface SectorJurisdictionFilterProps {
  clients: Client[];
  authority: 'All' | 'State' | 'Center';
  setAuthority: (auth: 'All' | 'State' | 'Center') => void;
  selectedSectors: string[];
  setSelectedSectors: (sectors: string[] | ((prev: string[]) => string[])) => void;
  buttonClassName?: string;
  totalFilteredCount?: number;
}

export const SectorJurisdictionFilter: React.FC<SectorJurisdictionFilterProps> = ({
  clients,
  authority,
  setAuthority,
  selectedSectors,
  setSelectedSectors,
  buttonClassName,
  totalFilteredCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sectorSearch, setSectorSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Extract unique sectors with client counts
  const sectorList = useMemo(() => {
    const counts: Record<string, number> = {};
    (clients || []).forEach(c => {
      if (!c || !c.gstProfile) return;
      const sec = (c.gstProfile.sector || c.gstProfile.range || '').trim();
      if (sec) {
        counts[sec] = (counts[sec] || 0) + 1;
      }
    });

    const uniqueKeys = Object.keys(counts).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    return uniqueKeys.map(key => ({
      name: key,
      count: counts[key]
    }));
  }, [clients]);

  const filteredSectorList = useMemo(() => {
    if (!sectorSearch.trim()) return sectorList;
    const s = sectorSearch.toLowerCase();
    return sectorList.filter(item => item.name.toLowerCase().includes(s));
  }, [sectorList, sectorSearch]);

  const hasActiveFilter = authority !== 'All' || selectedSectors.length > 0;

  const handleTogglePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 360;
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - popoverWidth - 12);
      }
      let top = rect.bottom + 6;
      if (top + 420 > window.innerHeight - 12) {
        top = Math.max(12, rect.top - 420);
      }
      setCoords({ top, left });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleSector = (secName: string) => {
    if (selectedSectors.includes(secName)) {
      setSelectedSectors(selectedSectors.filter(s => s !== secName));
    } else {
      setSelectedSectors([...selectedSectors, secName]);
    }
  };

  const handleSelectAllSectors = () => {
    setSelectedSectors(sectorList.map(s => s.name));
  };

  const handleClearSectors = () => {
    setSelectedSectors([]);
  };

  const handleResetAll = () => {
    setAuthority('All');
    setSelectedSectors([]);
    setSectorSearch('');
  };

  return (
    <div className="relative inline-block">
      {/* Filter Icon Button */}
      <button
        ref={buttonRef}
        onClick={handleTogglePopover}
        className={
          buttonClassName ||
          `h-9 px-3 rounded-xl border text-xs font-black uppercase tracking-tight transition-all flex items-center gap-1.5 shadow-xs ${
            hasActiveFilter
              ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200 ring-2 ring-amber-300'
              : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200'
          }`
        }
        title="Filter by Sector / Range & Authority (State/Center)"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="hidden sm:inline">Sector/Jurisdiction</span>
        {hasActiveFilter && (
          <span className="ml-0.5 bg-white text-amber-900 font-black text-[10px] px-1.5 py-0.2 rounded-full shadow-xs">
            {selectedSectors.length > 0 ? `${selectedSectors.length}` : authority}
          </span>
        )}
      </button>

      {/* Filter Popover Modal */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={{ top: coords.top, left: coords.left }}
          className="fixed bg-white border border-slate-200 rounded-2xl shadow-2xl z-[1000] w-[340px] sm:w-[380px] p-3.5 text-left animate-in zoom-in-95 origin-top-left flex flex-col gap-3"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Sector & Jurisdiction Filter</h4>
                <p className="text-[9px] font-bold text-slate-400">Select State/Center and Sector/Range side-by-side</p>
              </div>
            </div>
            {hasActiveFilter && (
              <button
                onClick={handleResetAll}
                className="text-[10px] font-black uppercase text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Side-by-Side Sections Container */}
          <div className="space-y-3">
            {/* Section 1: Authority Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                Jurisdiction Authority
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                {[
                  { key: 'All', label: 'All / Both' },
                  { key: 'State', label: 'State Authority' },
                  { key: 'Center', label: 'Center Authority' }
                ].map(item => {
                  const isActive = authority === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setAuthority(item.key as 'All' | 'State' | 'Center')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-center truncate ${
                        isActive
                          ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200 font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Sector / Range Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  Sectors / Ranges ({selectedSectors.length ? `${selectedSectors.length} selected` : 'All'})
                </label>
                <div className="flex items-center gap-1.5 text-[9px] font-bold">
                  <button
                    onClick={handleSelectAllSectors}
                    className="text-indigo-600 hover:underline uppercase"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={handleClearSectors}
                    className="text-slate-500 hover:underline uppercase"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Sector Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Find Sector or Range..."
                  value={sectorSearch}
                  onChange={e => setSectorSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Sector Multi-Select Checkboxes Grid */}
              <div className="max-h-44 overflow-y-auto pr-1 space-y-1 custom-scrollbar border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                {filteredSectorList.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-3 italic">No sectors found</p>
                ) : (
                  filteredSectorList.map(s => {
                    const isChecked = selectedSectors.includes(s.name);
                    return (
                      <label
                        key={s.name}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSector(s.name)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="truncate font-bold text-[11px]">{s.name}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                          {s.count} clients
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
            <span className="text-[10px] font-bold text-slate-500">
              {typeof totalFilteredCount === 'number'
                ? `Active Clients: ${totalFilteredCount}`
                : `${selectedSectors.length} Sectors Selected`}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-indigo-600 text-white font-black uppercase text-[10px] px-3 py-1.5 rounded-xl hover:bg-slate-900 transition-colors shadow-xs"
            >
              Apply & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
