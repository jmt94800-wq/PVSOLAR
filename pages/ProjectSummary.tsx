
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Visit, Client, Device, Address, VisitRequirement } from '../types';
import { 
  Table as TableIcon, 
  Search, 
  ArrowRight, 
  Download, 
  FileSpreadsheet, 
  Filter,
  Loader2 as LoaderIcon,
  User,
  MapPin,
  Zap,
  Calendar
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
            Synthèse globale de dimensionnement
          </p>
        </div>
        <Link to="/export" className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <Download size={20} />
        </Link>
      </div>

      {/* KPI Rapide */}
      <div className="grid grid-cols-2 gap-3 px-1">
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Cible</p>
          <p className="text-2xl font-black text-blue-600">{totalDailyProduction.toFixed(2)} <span className="text-xs font-bold text-blue-300">kWh/j</span></p>
        </div>
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Lignes</p>
          <p className="text-2xl font-black text-slate-800">{filteredRows.length} <span className="text-xs font-bold text-slate-300">items</span></p>
        </div>
      </div>

      {/* Barre de Recherche */}
      <div className="px-1">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Rechercher client, agent ou appareil..."
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
            <FileSpreadsheet size={16} className="text-blue-500" />
            Tableau de bord dimensionnement
          </h3>
          {filteredRows.length !== rows.length && (
            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-in fade-in">
              {filteredRows.length} résultats filtrés
            </span>
          )}
        </div>
        
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden border-b-4 border-b-blue-600">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-tighter sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Client</th>
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
                    <td className="p-5 text-[11px] font-bold text-slate-800 whitespace-nowrap sticky left-0 bg-white group-hover:bg-blue-50 transition-colors border-r border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-black">
                          {row.clientName.charAt(0)}
                        </div>
                        {row.clientName}
                      </div>
                    </td>
                    <td className="p-5 text-[11px] font-medium text-slate-600 whitespace-nowrap">
                       <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{row.lieu}</span>
                    </td>
                    <td className="p-5 text-[10px] text-slate-400 leading-tight max-w-[220px] truncate" title={row.adresse}>{row.adresse}</td>
                    <td className="p-5 text-[10px] text-slate-500 whitespace-nowrap font-medium italic">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className="p-5 text-[11px] text-slate-600 whitespace-nowrap font-black">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-300" />
                        {row.agent}
                      </div>
                    </td>
                    <td className="p-5 text-[11px] font-black text-blue-700 whitespace-nowrap bg-blue-50/20">
                      {row.appareil} <span className="text-blue-300 ml-1">x{row.quantity}</span>
                    </td>
                    <td className="p-5 text-[11px] font-bold text-slate-700 text-center">{row.puissanceHoraire.toFixed(2)}</td>
                    <td className="p-5 text-[11px] font-bold text-slate-700 text-center">{row.puissanceMax.toLocaleString()}</td>
                    <td className="p-5 text-[11px] font-bold text-green-600 text-center bg-green-50/10 font-mono">{row.duree}</td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-20 text-center text-slate-400 italic text-sm">
                      Aucune donnée correspondante.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
               <ArrowRight size={12} className="animate-pulse" /> Faites glisser pour explorer le tableau
             </p>
             <p className="text-[9px] font-black text-slate-300 uppercase">Projet Photovoltaïque v1.0</p>
          </div>
        </div>
      </section>

      <div className="px-1 pt-2">
        <Link 
          to="/"
          className="block w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-3xl text-center font-bold text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
};

export default ProjectSummary;
