import React, { useEffect, useMemo, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const EMPTY = '';

export interface SearchableParticipantComboboxProps {
  id: string;
  listBoxId: string;
  sectionLabel?: string;
  /** Primeira linha da lista (ex.: Todos os jogadores) — value sempre '' */
  allOptionLabel: string;
  /** Nomes já ordenados ou qualquer lista de opções únicas */
  options: string[];
  /** '' = modo “todos”; senão lado/participante escolhido */
  selectedKey: string;
  comboQuery: string;
  dropdownOpen: boolean;
  placeholder: string;
  onDropdownOpenChange: (open: boolean) => void;
  onSelectedKeyChange: (key: string) => void;
  onComboQueryChange: (query: string) => void;
}

export default function SearchableParticipantCombobox({
  id,
  listBoxId,
  sectionLabel,
  allOptionLabel,
  options,
  selectedKey,
  comboQuery,
  dropdownOpen,
  placeholder,
  onDropdownOpenChange,
  onSelectedKeyChange,
  onComboQueryChange,
}: SearchableParticipantComboboxProps) {
  const closeBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeBlurTimer.current) clearTimeout(closeBlurTimer.current);
    };
  }, []);

  const scheduleClose = () => {
    if (closeBlurTimer.current) clearTimeout(closeBlurTimer.current);
    closeBlurTimer.current = setTimeout(() => onDropdownOpenChange(false), 175);
  };

  const cancelClose = () => {
    if (closeBlurTimer.current) clearTimeout(closeBlurTimer.current);
  };

  const dropdownOptions = useMemo(() => {
    const term = comboQuery.trim().toLowerCase();
    const list: { value: string; label: string }[] = [];
    if (term === '' || allOptionLabel.toLowerCase().includes(term)) {
      list.push({ value: EMPTY, label: allOptionLabel });
    }
    for (const e of options) {
      if (term === '' || e.toLowerCase().includes(term)) {
        list.push({ value: e, label: e });
      }
    }
    return list;
  }, [options, comboQuery, allOptionLabel]);

  const inputDisplayValue = dropdownOpen
    ? comboQuery
    : selectedKey !== EMPTY
      ? selectedKey
      : comboQuery;

  const handleFocus = () => {
    cancelClose();
    onDropdownOpenChange(true);
    if (selectedKey !== EMPTY) {
      onComboQueryChange(selectedKey);
    }
  };

  const handleChange = (v: string) => {
    onComboQueryChange(v);
    onSelectedKeyChange(EMPTY);
    onDropdownOpenChange(true);
  };

  const pick = (value: string) => {
    onSelectedKeyChange(value);
    onComboQueryChange('');
    onDropdownOpenChange(false);
  };

  return (
    <section className="space-y-2">
      {sectionLabel && (
        <p className="font-lexend text-[10px] font-bold uppercase tracking-widest text-secondary">
          {sectionLabel}
        </p>
      )}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-border-muted bg-white px-3 py-2 shadow-sm ring-primary/25 focus-within:ring-2">
          <Search className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={dropdownOpen}
            aria-controls={listBoxId}
            aria-autocomplete="list"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            value={inputDisplayValue}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm font-semibold text-navy-900 outline-none ring-0 placeholder:font-normal placeholder:text-secondary/70 focus:ring-0"
            onChange={e => handleChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={() => scheduleClose()}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.preventDefault();
                onDropdownOpenChange(false);
              }
            }}
          />
          <button
            type="button"
            tabIndex={-1}
            className={`shrink-0 rounded-lg p-1 text-secondary transition-transform hover:bg-slate-100 hover:text-navy-900 ${dropdownOpen ? 'rotate-180' : ''}`}
            aria-label={dropdownOpen ? 'Fechar lista' : 'Abrir lista'}
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              if (dropdownOpen) {
                onDropdownOpenChange(false);
              } else {
                cancelClose();
                onDropdownOpenChange(true);
                if (selectedKey !== EMPTY) {
                  onComboQueryChange(selectedKey);
                }
              }
            }}
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {dropdownOpen && (
          <ul
            id={listBoxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border-muted bg-white py-1 shadow-lg"
          >
            {dropdownOptions.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-secondary">Nenhuma correspondência</li>
            ) : (
              dropdownOptions.map(opt => {
                const sel = selectedKey === opt.value;
                return (
                  <li key={opt.value === EMPTY ? '__ALL__' : opt.value} role="option" aria-selected={sel}>
                    <button
                      type="button"
                      className={`flex w-full px-3 py-2 text-left text-sm ${
                        opt.value === EMPTY ? 'font-medium' : 'font-semibold'
                      } ${sel ? 'bg-primary/15 text-navy-900' : 'text-navy-900 hover:bg-slate-50'} ${
                        opt.value === EMPTY && !sel ? 'text-secondary' : ''
                      }`}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => pick(opt.value)}
                    >
                      {opt.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
