
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Visit, Client, Device, Address } from '../types';
import { 
  Table as TableIcon, 
  Search, 
  ArrowRight, 
  Download, 
  FileSpreadsheet, 
  FileJson,
  Loader2 as LoaderIcon,
  User,
  Zap,
  FileDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SummaryRow {
  clientName: string;
  lieu: string;
  adresse: string;
  date: string;
  agent: string;
  appareil: string;
  puissanceHoraire: number;
  puissanceMax: number;
  duree: number;
  quantity: number;
  visitId: string;
}

const ProjectSummary: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [allVisits, allClients, allAddresses, allCatalogue] = await Promise.all([
        db.visits.toArray(),
        db.clients.toArray(),
        db.addresses.toArray(),
        db.devices.toArray()
      ]);

      const flattened: SummaryRow[] = [];

      allVisits.forEach(visit => {
        const client = allClients.find(c => c.id === visit.clientId);
        const address = allAddresses.find(a => a.id === visit.addressId);
        
        visit.requirements.forEach(req => {
          const device = allCatalogue.find(d => d.id === req.deviceId);
          if (device) {
            flattened.push({
              clientName: client?.name || 'Inconnu',
              lieu: address?.label || 'N/A',
              adresse: address ? `${address.street}, ${address.zip} ${address.city}` : 'N/A',
              date: visit.date,
              agent: visit.agentName || 'Inconnu',
              appareil: req.overrideName || device.name,
              puissanceHoraire: req.overrideHourlyPower ?? device.hourlyPower,
              puissanceMax: req.overrideMaxPower ?? device.maxPower,
              duree: req.overrideUsageDuration ?? device.usageDuration,
              quantity: req.quantity,
              visitId: visit.id
            });
          }
        });
      });

      setRows(flattened.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase();
    return rows.filter(r => 
      r.clientName.toLowerCase().includes(term) || 
      r.agent.toLowerCase().includes(term) || 
      r.appareil.toLowerCase().includes(term)
    );
  }, [rows, search]);

  const totalDailyProduction = useMemo(() => {
    return filteredRows.reduce((acc, r) => acc + (r.puissanceHoraire * r.duree * r.quantity), 0);
  }, [filteredRows]);

  const exportJSON = () => {
    setExporting('json');
    try {
      const dataStr = JSON.stringify(filteredRows, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SolarVisit_Summary_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } finally {
      setTimeout(() => setExporting(null), 500);
    }
  };

  const exportCSV = () => {
    setExporting('csv');
    try {
      const headers = ['Client', 'Lieu', 'Adresse', 'Date', 'Agent', 'Appareil', 'Puissance Horaire (kWh)', 'Puissance Max (W)', 'Duree (h/j)', 'Quantite'];
      const csvContent = [
        headers.join(';'),
        ...filteredRows.map(row => [
          `"${row.clientName}"`,
          `"${row.lieu}"`,
          `"${row.adresse.replace(/"/g, '""')}"`,
          new Date(row.date).toLocaleDateString(),
          `"${row.agent}"`,
          `"${row.appareil}"`,
          row.puissanceHoraire.toString().replace('.', ','),
          row.puissanceMax,
          row.duree.toString().replace('.', ','),
          row.quantity
        ].join(';'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SolarVisit_Summary_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } finally {
      setTimeout(() => setExporting(null), 500);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <LoaderIcon className="animate-spin text-blue-600" size={40} />
      <p className="text-slate-400 font-medium text-sm animate-pulse">Compilation des données projet...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      <div className="px-1 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 leading-tight">Récapitulatif Projet</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
            <Zap size={14} className="text-yellow-500 fill-yellow-500" />
            Extraction des données dimensionnement
          </p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={exportJSON}
            disabled={!!exporting}
            className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors shadow-sm"
            title="Exporter en JSON"
           >
             {exporting === 'json' ? <LoaderIcon size={20} className="animate-spin" /> : <FileJson size={20} />}
           </button>
           <button 
            onClick={exportCSV}
            disabled={!!exporting}
            className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-colors shadow-sm"
            title="Exporter en CSV"
           >
             {exporting === 'csv' ? <LoaderIcon size={20} className="animate-spin" /> : <FileSpreadsheet size={20} />}
           </button>
        </div>
      </div>

      {/* KPI Rapide */}
      <div className="grid grid-cols-2 gap-3 px-1">
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Production Cible</p>
          <p className="text-2xl font-black text-blue-600 relative z-10">{totalDailyProduction.toFixed(2)} <span className="text-xs font-bold text-blue-300">kWh/j</span></p>
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
             <Zap size={60} className="text-blue-600 fill-blue-600" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Données Projet</p>
          <p className="text-2xl font-black text-slate-800 relative z-10">{filteredRows.length} <span className="text-xs font-bold text-slate-300">lignes</span></p>
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
             <FileDown size={60} className="text-slate-900 fill-slate-900" />
          </div>
        </div>
      </div>

      {/* Barre de Recherche */}
      <div className="px-1">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Filtrer par client, agent ou matériel..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[24px] outline-none shadow-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau Principal */}
      <section className="space-y-3 px-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <TableIcon size={16} className="text-blue-500" />
            Tableau de bord dimensionnement
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {filteredRows.length} lignes affichées
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden border-b-4 border-b-blue-600">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-tighter sticky left-0 bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Client</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Lieu</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Adresse Complète</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Date Visite</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Agent</th>
                  <th className="p-5 text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50/30">Appareil</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">P. Horaire (kWh)</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">P. Max (W)</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">Durée (h/j)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="p-5 text-[11px] font-bold text-slate-800 whitespace-nowrap sticky left-0 bg-white group-hover:bg-blue-50 transition-colors border-r border-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-black border border-slate-200 group-hover:bg-white group-hover:text-blue-600 transition-all">
                          {row.clientName.charAt(0)}
                        </div>
                        {row.clientName}
                      </div>
                    </td>
                    <td className="p-5 text-[11px] font-medium text-slate-600 whitespace-nowrap">
                       <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-[10px] group-hover:bg-white transition-colors">{row.lieu}</span>
                    </td>
                    <td className="p-5 text-[10px] text-slate-400 leading-tight max-w-[220px] truncate" title={row.adresse}>{row.adresse}</td>
                    <td className="p-5 text-[10px] text-slate-500 whitespace-nowrap font-medium italic">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className="p-5 text-[11px] text-slate-600 whitespace-nowrap font-black">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
                        {row.agent}
                      </div>
                    </td>
                    <td className="p-5 text-[11px] font-black text-blue-700 whitespace-nowrap bg-blue-50/10">
                      {row.appareil} <span className="text-blue-300 ml-1 font-bold">x{row.quantity}</span>
                    </td>
                    <td className="p-5 text-[11px] font-bold text-slate-700 text-center font-mono">{row.puissanceHoraire.toFixed(2)}</td>
                    <td className="p-5 text-[11px] font-bold text-slate-700 text-center font-mono">{row.puissanceMax.toLocaleString()}</td>
                    <td className="p-5 text-[11px] font-bold text-green-600 text-center bg-green-50/10 font-mono">{row.duree}</td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-20 text-center text-slate-400 italic text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="opacity-20" />
                        <p>Aucune donnée ne correspond à votre recherche.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
               <ArrowRight size={12} className="animate-pulse" /> Faites glisser pour explorer toutes les colonnes
             </p>
             <div className="flex items-center gap-4">
                <button onClick={exportJSON} className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase transition-colors">JSON</button>
                <button onClick={exportCSV} className="text-[9px] font-black text-slate-400 hover:text-green-600 uppercase transition-colors">CSV</button>
             </div>
          </div>
        </div>
      </section>

      <div className="px-1 pt-2">
        <Link 
          to="/"
          className="block w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-[24px] text-center font-bold text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm hover:border-slate-300"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
};

export default ProjectSummary;
