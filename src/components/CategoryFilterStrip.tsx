import React from 'react';
import type { Category } from '../types';
import {
  CATEGORY_COLORS,
  CATEGORY_FILTER_DEFS,
  type CategoryFilterKey,
} from '../constants/tournamentData';

const CHIP_BASE =
  'shrink-0 px-4 py-2 rounded-full font-lexend text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border transition-colors';

function chipClasses(selected: boolean, key: CategoryFilterKey): string {
  if (!selected) {
    return `${CHIP_BASE} bg-white border-border-muted text-secondary`;
  }
  if (key === 'TODOS') {
    return `${CHIP_BASE} bg-navy-900 border-navy-900 text-white`;
  }
  const cat = key as Category;
  const cc = CATEGORY_COLORS[cat] || CATEGORY_COLORS.A;
  return `${CHIP_BASE} ${cc.bg} ${cc.text} ${cc.border} shadow-sm`;
}

export interface CategoryFilterStripProps {
  value: CategoryFilterKey;
  onChange: (v: CategoryFilterKey) => void;
  /** Ocultar chip "Todos" (ex.: página Chaves, onde sempre há uma categoria ativa). */
  includeTodos?: boolean;
  className?: string;
}

const CategoryFilterStrip: React.FC<CategoryFilterStripProps> = ({
  value,
  onChange,
  includeTodos = true,
  className = '',
}) => {
  const items = includeTodos
    ? CATEGORY_FILTER_DEFS
    : CATEGORY_FILTER_DEFS.filter(d => d.key !== 'TODOS');

  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 no-scrollbar ${className}`}>
      {items.map(({ key, label }) => (
        <button key={key} type="button" onClick={() => onChange(key)} className={chipClasses(value === key, key)}>
          {label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilterStrip;
