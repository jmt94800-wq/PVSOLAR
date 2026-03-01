
import React from 'react';
import { QuoteData } from '../types';
import { Zap, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  data: QuoteData;
  visitId: string;
}

const DashboardSummaryCard: React.FC<Props> = ({ data, visitId }) => {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden border-b-4 border-b-blue-600 group">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-widest">Dernière Étude</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 leading-tight">{data.name}</h3>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <MapPin size={12} className="text-red-400" /> {data.siteName} — {data.address}
            </p>
          </div>
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <Zap size={24} className="fill-blue-600/10" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Besoin estimé</p>
            <p className="text-lg font-black text-slate-700">{data.totalDailyKWh.toFixed(1)} <span className="text-[10px] font-bold">kWh/j</span></p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Puis. Crête</p>
            <p className="text-lg font-black text-slate-700">{data.totalMaxW} <span className="text-[10px] font-bold">W</span></p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{data.visitDate}</span>
          </div>
          <Link 
            to={`/analysis/${visitId}`}
            className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all"
          >
            Voir l'analyse <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      
      <div className="px-6 py-3 bg-blue-600/5 border-t border-blue-600/10">
        <p className="text-[9px] font-bold text-blue-600/60 uppercase text-center tracking-widest italic">
          {data.items.length} appareils relevés au total
        </p>
      </div>
    </div>
  );
};

export default DashboardSummaryCard;
