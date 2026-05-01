import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match } from '../types';
import Layout from '../components/Layout';
import MatchCard from '../components/MatchCard';
import { Search } from 'lucide-react';

const Agenda: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const q = query(collection(db, 'matches'), orderBy('status', 'asc'));
        const snap = await getDocs(q);
        setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Match)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const filteredMatches = matches.filter(m => {
    const matchCat = filter === 'Todas' || m.category === filter;
    const matchSearch = m.p1.toLowerCase().includes(search.toLowerCase()) || m.p2.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <Layout title="Agenda">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar jogador..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl font-lexend text-sm focus:ring-1 focus:ring-primary outline-none shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['Todas', 'A', 'B', 'C', 'Duplas'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-lexend text-[10px] font-bold uppercase tracking-wider transition-all ${
                filter === cat ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-100'
              }`}
            >
              {cat === 'Todas' ? 'Todas' : `Cat ${cat}`}
            </button>
          ))}
        </div>

        {/* Match List */}
        <div className="space-y-4">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(m => <MatchCard key={m.id} match={m} />)
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 font-lexend text-sm">Nenhuma partida encontrada.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Agenda;
