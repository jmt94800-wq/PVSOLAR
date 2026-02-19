
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Visit, Client, Device, Address, ExportRow } from '../types';
import { flattenVisitData } from '../utils';
import { 
  Table as TableIcon, 
  Search, 
  ArrowRight, 
  FileSpreadsheet, 
  FileJson,
  Loader2 as LoaderIcon,
  User,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectSummary: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [rows, setRows] = useState<ExportRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allVisits, allClients, allAddresses, allCatalogue] = await Promise.all([
          db.visits.toArray(),
          db.clients.toArray(),
          db.addresses.toArray(),
          db.devices.toArray()
        ]);

        // La fonction flattenVisitData gère maintenant l'autonomie et la ligne Batterie
        const flattened = flattenVisitData(allVisits, allClients, allAddresses, allCatalogue);
        setRows(flattened);
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase();
    return rows.filter(r => 
      r.client.toLowerCase().includes(term) || 
      r.agent.toLowerCase().includes(term) || 
      r.appareil.toLowerCase().includes(term)
    );
  }, [rows, search]);

  const exportJSON = () => {
    setExporting('json');
    try {
      const dataStr = JSON.stringify(filteredRows, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Projet_SolarVisit_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } finally {
      setTimeout(() => setExporting(null), 500);
    }
  };

  const exportCSV = () => {
    setExporting('csv');
    try {
      const headers = ['Client', 'Lieu', 'Adresse', 'Date', 'Agent', 'Appareil', 'Inclus Puis. Crête', 'Puissance Horaire (kWh)', 'Puissance Max (W)', 'Duree (h/j)', 'Quantité'];
      const csvContent = [
        headers.join(';'),
        ...filteredRows.map(row => [
          `"${row.client}"`,
          `"${row.lieu}"`,
          `"${row.adresse.replace(/"/g, '""')}"`,
          row.date,
          `"${row.agent}"`,
          `"${row.appareil}"`,
          row.inclusPuissance ? 'OUI' : 'NON',
          row.puissanceHoraireKWh.toString().replace('.', ','),
          row.puissanceMaxW,
          row.dureeHj.toString().replace('.', ','),
          row.quantite
        ].join(';'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Projet_SolarVisit_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } finally {
      setTimeout(() => setExporting(null), 500);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <LoaderIcon className="animate-spin text-blue-600" size={40} />
      <p className="text-slate-400 font-medium text-sm animate-pulse">Chargement du récapitulatif...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      <div className="px-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 leading-tight">Projet Global</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Récapitulatif dimensionnement</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={exportJSON}
            disabled={!!exporting}
            className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors shadow-sm"
           >
             {exporting === 'json' ? <LoaderIcon size={18} className="animate-spin" /> : <FileJson size={18} />}
           </button>
           <button 
            onClick={exportCSV}
            disabled={!!exporting}
            className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-colors shadow-sm"
           >
             {exporting === 'csv' ? <LoaderIcon size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
           </button>
        </div>
      </div>

      <div className="px-1">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Filtrer le projet (Client, Agent, Appareil...)"
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[20px] outline-none shadow-sm focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <section className="px-1">
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl overflow-hidden border-b-4 border-b-blue-600">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-tighter sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Client</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Lieu</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Adresse</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Date</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Agent</th>
                  <th className="p-5 text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50/20">Appareil</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">Inclus P. Crête</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">Quantité</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">P. Horaire (kWh)</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">P. Max (W)</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">Durée (h/j)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className={`hover:bg-blue-50/10 transition-colors group ${!row.inclusPuissance ? 'opacity-70' : ''}`}>
                    <td className="p-5 text-[11px] font-bold text-slate-800 whitespace-nowrap sticky left-0 bg-white group-hover:bg-blue-50 transition-colors border-r border-slate-50">
                      {row.client}
                    </td>
                    <td className="p-5 text-[11px] font-medium text-slate-600 whitespace-nowrap">
                       <span className="bg-slate-50 px-2 py-1 rounded-md text-[10px]">{row.lieu}</span>
                    </td>
                    <td className="p-5 text-[10px] text-slate-400 truncate max-w-[200px]">{row.adresse}</td>
                    <td className="p-5 text-[10px] text-slate-500 whitespace-nowrap font-medium">{row.date}</td>
                    <td className="p-5 text-[11px] text-slate-600 whitespace-nowrap font-black">{row.agent}</td>
                    <td className="p-5 text-[11px] font-black text-blue-700 whitespace-nowrap bg-blue-50/5">{row.appareil}</td>
                    <td className="p-5 text-[11px] text-center">
                       <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${row.inclusPuissance ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                         {row.inclusPuissance ? 'Oui' : 'Non'}
                       </span>
                    </td>
                    <td className="p-5 text-[11px] font-bold text-slate-700 text-center">{row.quantite}</td>
                    <td className="p-5 text-[11px] font-bold text-slate-700 text-center font-mono">{row.puissanceHoraireKWh.toFixed(2)}</td>
                    <td className="p-5 text-[11px] font-bold text-slate-700 text-center font-mono">{row.puissanceMaxW.toLocaleString()}</td>
                    <td className="p-5 text-[11px] font-bold text-green-600 text-center font-mono">{row.dureeHj}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectSummary;
