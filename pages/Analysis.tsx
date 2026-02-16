
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../db';
import { Visit, Client, Device } from '../types';
import { 
  BarChart3, ArrowLeft, Zap, TrendingUp, 
  Activity, ArrowRight, User, Calendar
} from 'lucide-react';

const Analysis: React.FC = () => {
  const { id: visitId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    visit: (Visit & { client?: Client }) | null;
    allVisits: Visit[];
    catalogue: Device[];
  }>({ visit: null, allVisits: [], catalogue: [] });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [allVisits, catalogue] = await Promise.all([
        db.visits.toArray(),
        db.devices.toArray()
      ]);

      let selectedVisit = null;
      if (visitId) {
        const v = await db.visits.get(visitId);
        if (v) {
          const c = await db.clients.get(v.clientId);
          selectedVisit = { ...v, client: c };
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
        totalHourlyConsumption: acc.totalHourlyConsumption + (hourlyPower * req.quantity),
        totalDailyConsumption: acc.totalDailyConsumption + (hourlyPower * duration * req.quantity),
        deviceCount: acc.deviceCount + req.quantity
      };
    }, { totalPeakPower: 0, totalHourlyConsumption: 0, totalDailyConsumption: 0, deviceCount: 0 });
  }, [data]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-slate-800">Analyse Énergétique</h2>
        <div className="w-10" />
      </div>

      {!data.visit ? (
        <div className="space-y-4">
          <p className="text-slate-500 text-sm px-1">Sélectionnez une visite pour voir l'analyse détaillée :</p>
          <div className="space-y-2">
            {data.allVisits.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 italic text-sm">
                Aucune visite enregistrée pour l'analyse.
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
        <>
          {/* Header Visite */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <User size={28} />
            </div>
            <div>
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{data.visit.client?.name}</p>
              <h3 className="text-lg font-bold text-slate-800">Étude de site - {new Date(data.visit.date).toLocaleDateString()}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Réalisée par {data.visit.agentName}</p>
            </div>
          </div>

          {/* Cards Indicateurs */}
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[32px] text-white shadow-xl shadow-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-blue-100 uppercase tracking-widest opacity-80">Puissance Crête (W)</p>
                  <h4 className="text-4xl font-black mt-1">{stats?.totalPeakPower.toLocaleString()} <span className="text-sm font-medium opacity-60">W</span></h4>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <Zap size={24} className="fill-white text-white" />
                </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-blue-100/70 border-t border-white/10 pt-4">
                Correspond à la somme des puissances maximales de tous les appareils si allumés simultanément.
              </p>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conso. Horaire Totale</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-1">{stats?.totalHourlyConsumption.toFixed(2)} <span className="text-sm font-medium text-slate-400">kW/h</span></h4>
                </div>
                <div className="bg-green-50 p-3 rounded-2xl text-green-600">
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Consommation Journalière</span>
                  <span className="font-black text-slate-800">{stats?.totalDailyConsumption.toFixed(1)} kWh/j</span>
                </div>
                <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Liste détaillée */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Détails par appareil</h3>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
              {data.visit.requirements.map((req, idx) => {
                const baseDevice = data.catalogue.find(d => d.id === req.deviceId);
                if (!baseDevice) return null;

                const name = req.overrideName || baseDevice.name;
                const pMax = req.overrideMaxPower ?? baseDevice.maxPower;
                const pHourly = req.overrideHourlyPower ?? baseDevice.hourlyPower;
                const qty = req.quantity;

                return (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{name} <span className="text-slate-300 font-medium">x{qty}</span></p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Impact : { (pHourly * qty).toFixed(2) } kW/h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-700">{ (pMax * qty).toLocaleString() } W</p>
                      <p className="text-[9px] text-blue-500 font-bold uppercase">Puis. Max</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <Link 
            to={`/visits/${visitId}`}
            className="block w-full bg-slate-100 text-slate-600 py-4 rounded-2xl text-center font-bold text-sm hover:bg-slate-200 transition-colors"
          >
            Retourner à la fiche visite
          </Link>
        </>
      )}
    </div>
  );
};

export default Analysis;

// Utility Icon Loader
const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <Activity className={className} size={size} />
);
