
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../db';
import { Visit, Client, Device, Address } from '../types';
import { 
  BarChart3, ArrowLeft, Zap, TrendingUp, 
  Activity, ArrowRight, User, Loader2 as LoaderIcon,
  FileSpreadsheet
} from 'lucide-react';

const Analysis: React.FC = () => {
  const { id: visitId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    visit: (Visit & { client?: Client; address?: Address }) | null;
    allVisits: Visit[];
    catalogue: Device[];
  }>({ visit: null, allVisits: [], catalogue: [] });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [allVisits, catalogue, allAddresses] = await Promise.all([
        db.visits.toArray(),
        db.devices.toArray(),
        db.addresses.toArray()
      ]);

      let selectedVisit = null;
      if (visitId) {
        const v = await db.visits.get(visitId);
        if (v) {
          const c = await db.clients.get(v.clientId);
          const a = allAddresses.find(addr => addr.id === v.addressId);
          selectedVisit = { ...v, client: c, address: a };
        }
      }

      setData({ visit: selectedVisit, allVisits, catalogue });
      setLoading(false);
    };
    loadData();
  }, [visitId]);

  const stats = useMemo(() => {
    if (!data.visit) return null;
    
    return data.visit.requirements.reduce((acc, req) => {
      const baseDevice = data.catalogue.find(d => d.id === req.deviceId);
      if (!baseDevice) return acc;

      const maxPower = req.overrideMaxPower ?? baseDevice.maxPower;
      const hourlyPower = req.overrideHourlyPower ?? baseDevice.hourlyPower;
      const duration = req.overrideUsageDuration ?? baseDevice.usageDuration;

      return {
        totalPeakPower: acc.totalPeakPower + (maxPower * req.quantity),
        totalDailyConsumption: acc.totalDailyConsumption + (hourlyPower * duration * req.quantity),
        deviceCount: acc.deviceCount + req.quantity
      };
    }, { totalPeakPower: 0, totalDailyConsumption: 0, deviceCount: 0 });
  }, [data]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoaderIcon className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between px-1">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-slate-800">Analyse Énergétique</h2>
        <div className="w-10" />
      </div>

      {!data.visit ? (
        <div className="space-y-4 px-1">
          <p className="text-slate-500 text-sm">Sélectionnez une visite pour générer le récapitulatif devis :</p>
          <div className="space-y-2">
            {data.allVisits.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 italic text-sm">
                Aucune visite enregistrée.
              </div>
            ) : (
              data.allVisits.map(v => (
                <Link 
                  key={v.id} 
                  to={`/analysis/${v.id}`}
                  className="block bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all active:scale-[0.98]"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Activity size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Visite du {new Date(v.date).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{v.status}</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-300" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Visite Rapide */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 mx-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <User size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate">{data.visit.client?.name}</p>
              <h3 className="text-base font-bold text-slate-800 truncate">Étude de consommation</h3>
              <p className="text-[10px] text-slate-400 font-medium">Par {data.visit.agentName} • {new Date(data.visit.date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* PRODUCTION CIBLE - MISE EN AVANT MAJEURE */}
          <div className="px-1">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <TrendingUp size={16} />
                  <p className="text-xs font-black uppercase tracking-widest">Production Journalière Cible</p>
                </div>
                <div className="flex items-baseline gap-3">
                  <h4 className="text-6xl font-black">{stats?.totalDailyConsumption.toFixed(2)}</h4>
                  <span className="text-2xl font-bold opacity-60">kWh / jour</span>
                </div>
                <div className="mt-6 flex items-center gap-3">
                   <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                      <p className="text-[10px] font-bold text-blue-100 uppercase">Puissance Crête Totale</p>
                      <p className="text-lg font-black">{stats?.totalPeakPower.toLocaleString()} <span className="text-xs font-medium">W</span></p>
                   </div>
                   <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                      <p className="text-[10px] font-bold text-blue-100 uppercase">Appareils</p>
                      <p className="text-lg font-black">{stats?.deviceCount}</p>
                   </div>
                </div>
              </div>
              <Zap className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
            </div>
          </div>

          {/* TABLEAU RÉCAPITULATIF À 9 COLONNES */}
          <section className="space-y-3 px-1">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-blue-500" />
                Détail pour établissement du devis (9 colonnes)
              </h3>
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Client</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Nom (Lieu)</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Adresse Complète</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Date Visite</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Agent</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Appareil</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">Puiss. Horaire (kWh)</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">Puiss. Max (W)</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">Durée (h/j)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.visit.requirements.map((req, idx) => {
                      const baseDevice = data.catalogue.find(d => d.id === req.deviceId);
                      if (!baseDevice) return null;

                      const addr = data.visit?.address;
                      const fullAddr = addr ? `${addr.street}, ${addr.zip} ${addr.city}` : 'N/A';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-[11px] font-bold text-slate-800 whitespace-nowrap">{data.visit?.client?.name}</td>
                          <td className="p-4 text-[11px] font-medium text-slate-600 whitespace-nowrap">{addr?.label || 'Visite'}</td>
                          <td className="p-4 text-[10px] text-slate-500 leading-tight max-w-[200px] truncate">{fullAddr}</td>
                          <td className="p-4 text-[11px] text-slate-600 whitespace-nowrap">{new Date(data.visit?.date || '').toLocaleDateString()}</td>
                          <td className="p-4 text-[11px] text-slate-600 whitespace-nowrap font-black">{data.visit?.agentName}</td>
                          <td className="p-4 text-[11px] font-black text-blue-700 whitespace-nowrap">
                            {req.overrideName || baseDevice.name} 
                            <span className="text-slate-300 ml-1 font-bold">x{req.quantity}</span>
                          </td>
                          <td className="p-4 text-[11px] font-bold text-slate-700 text-center">{(req.overrideHourlyPower ?? baseDevice.hourlyPower).toFixed(2)}</td>
                          <td className="p-4 text-[11px] font-bold text-slate-700 text-center">{(req.overrideMaxPower ?? baseDevice.maxPower).toLocaleString()}</td>
                          <td className="p-4 text-[11px] font-bold text-green-600 text-center">{(req.overrideUsageDuration ?? baseDevice.usageDuration)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center">
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                   <ArrowRight size={10} className="animate-pulse" /> Faites défiler horizontalement pour voir tout le tableau récapitulatif
                 </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 px-1">
            <Link 
              to={`/visits/${visitId}`}
              className="block w-full bg-slate-900 text-white py-4 rounded-2xl text-center font-bold text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg"
            >
              Retourner à la fiche visite
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;
