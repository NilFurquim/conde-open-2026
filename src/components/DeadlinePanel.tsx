import React, { useState } from 'react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Settings } from 'lucide-react';
import { saveSettings } from '../lib/matchService';
import { TournamentSettings } from '../types';

const ROUND_KEYS = [
  'A-Grupos', 'A-Quartas', 'A-Semifinais', 'A-Final',
  'B-Grupos', 'B-Oitavas', 'B-Quartas', 'B-Semifinais', 'B-Final',
  'C-Grupos', 'C-Semifinais', 'C-Final',
  'Duplas-Play-in', 'Duplas-Quartas', 'Duplas-Semifinais', 'Duplas-Final',
];

const DeadlinePanel: React.FC<{ settings: TournamentSettings; onSaved: () => void }> = ({ settings, onSaved }) => {
  const [deadlines, setDeadlines] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    ROUND_KEYS.forEach(k => {
      const ts = settings.roundDeadlines?.[k];
      d[k] = ts ? format(ts.toDate(), "yyyy-MM-dd'T'HH:mm") : '';
    });
    return d;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const roundDeadlines: Record<string, Timestamp> = {};
      Object.entries(deadlines).forEach(([k, v]) => {
        if (v) roundDeadlines[k] = Timestamp.fromDate(new Date(v));
      });
      await saveSettings({ roundDeadlines });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-border-muted rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-secondary" />
        <h3 className="font-lexend font-bold text-sm text-navy-900">Prazos por Rodada</h3>
      </div>
      <p className="text-xs text-secondary">Jogadores só podem editar resultados até o prazo definido.</p>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {ROUND_KEYS.map(k => (
          <div key={k} className="flex items-center gap-2">
            <label className="text-xs text-secondary w-36 shrink-0">{k}</label>
            <input
              type="datetime-local"
              value={deadlines[k]}
              onChange={e => setDeadlines(prev => ({ ...prev, [k]: e.target.value }))}
              className="flex-1 text-xs border border-border-muted rounded-lg px-2 py-1.5 outline-none"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-navy-900 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar Prazos'}
      </button>
    </div>
  );
};

export default DeadlinePanel;
