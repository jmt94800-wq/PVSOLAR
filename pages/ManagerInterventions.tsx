
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Visit, Client, Address, Device } from '../types';
import { 
  ClipboardList, Search, User, MapPin, 
  Calendar, ChevronDown, ChevronUp, 
  FileText, Zap, LayoutGrid, CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ManagerInterventions: React.FC = () => {
  const [data, setData] = useState<{
    visits: (Visit & { client?: Client; address?: Address })[];
    devices: Device[];
  }>({ visits: [], devices: [] });
  
  const [search, setSearch] = useState('');
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [allVisits, allClients, allAddresses, allDevices] = await Promise.all([
        db.visits.toArray(),
        db.clients.toArray(),
        db.addresses.toArray(),
        db.devices.toArray()
      ]);

      const enriched = allVisits.map(v => ({
        ...v,
        client: allClients.find(c => c.id === v.clientId),
        address: allAddresses.find(a => a.id === v.addressId)
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setData({ visits: enriched, devices: allDevices });
    };
    loadData();
  }, []);

  const filteredVisits = data.visits.filter(v => 
    v.client?.name.toLowerCase().includes(search.toLowerCase()) ||
    v.agentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Pilotage Équipe</h2>
        <Link to="/manager/calendar" className="p-2 bg-blue-50 text-blue-600 rounded-xl">
          <CalendarDays size={24} />
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Rechercher un agent ou un client..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredVisits.length === 0 ? (
          <div className="text-center py-20 text-slate-400 italic bg-white rounded-3xl border border-dashed border-slate-200">
            Aucune intervention trouvée
          </div>
        ) : (
          filteredVisits.map((visit) => {
            const isExpanded = expandedVisitId === visit.id;
            return (
              <div key={visit.id} className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden transition-all">
                {/* Header Visit Card */}
                <div 
                  onClick={() => setExpandedVisitId(isExpanded ? null : visit.id)}
                  className="p-5 flex items-center justify-between active:bg-slate-50 cursor-pointer"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight">{visit.client?.name}</h3>
                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-0.5">
                        Agent : {visit.agentName || 'Non assigné'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${visit.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {visit.status === 'COMPLETED' ? 'Terminé' : 'Prévu'}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar size={10} /> {new Date(visit.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-6 border-t border-slate-50 space-y-5 pt-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                       <div className="flex items-start gap-2 text-xs text-slate-600">
                         <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                         <span className="font-medium">{visit.address?.label} : {visit.address?.street}, {visit.address?.zip} {visit.address?.city}</span>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                        <LayoutGrid size={12} /> Détails Matériels (Base Devis)
                      </h4>
                      <div className="space-y-2">
                        {visit.requirements.length === 0 ? (
                          <p className="text-xs text-slate-400 italic px-1">Aucun matériel saisi sur le terrain.</p>
                        ) : (
                          visit.requirements.map((req, idx) => {
                            const baseDevice = data.devices.find(d => d.id === req.deviceId);
                            const name = req.overrideName || baseDevice?.name || 'Inconnu';
                            const pMax = req.overrideMaxPower ?? baseDevice?.maxPower ?? 0;
                            const pHourly = req.overrideHourlyPower ?? baseDevice?.hourlyPower ?? 0;
                            const duration = req.overrideUsageDuration ?? baseDevice?.usageDuration ?? 0;

                            return (
                              <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{name} <span className="text-blue-600">x{req.quantity}</span></p>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {pMax}W • {pHourly}kWh/h • {duration}h/j
                                  </p>
                                </div>
                                <div className="text-right">
                                   <p className="text-xs font-black text-slate-700">{(pHourly * duration * req.quantity).toFixed(2)}</p>
                                   <p className="text-[8px] text-slate-400 uppercase font-bold">kWh/j</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {visit.report && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                          <FileText size={12} /> Rapport de l'agent
                        </h4>
                        <p className="text-xs text-slate-600 bg-blue-50/30 p-4 rounded-2xl border border-blue-50 leading-relaxed italic">
                          "{visit.report}"
                        </p>
                      </div>
                    )}

                    <Link 
                      to={`/visits/${visit.id}`} 
                      className="block w-full text-center py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Ouvrir la fiche complète
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ManagerInterventions;
