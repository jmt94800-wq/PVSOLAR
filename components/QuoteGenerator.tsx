
import React from 'react';
import { QuoteData } from '../types';
import { FileText, Printer, Download, Zap, AlertCircle } from 'lucide-react';

interface Props {
  data: QuoteData;
}

const QuoteGenerator: React.FC<Props> = ({ data }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden print:shadow-none print:border-none">
      {/* Header Devis */}
      <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-yellow-400 fill-yellow-400" size={24} />
            <span className="text-xl font-black tracking-tighter">SolarVisit Pro</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Offre Commerciale</h2>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest">Étude de dimensionnement</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-[10px] font-black uppercase">Date de visite</p>
          <p className="font-bold">{data.visitDate}</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Infos Client */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Destinataire</h3>
            <p className="text-lg font-black text-slate-800">{data.name}</p>
            <p className="text-sm text-slate-500 mt-1">{data.address}</p>
          </div>
          <div className="text-right">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lieu d'installation</h3>
            <p className="text-sm font-bold text-slate-700">{data.siteName}</p>
          </div>
        </div>

        {/* Tableau des matériels */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Désignation</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Qté</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Puis. (W)</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Conso. (kWh/j)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.items.map((item, i) => (
                <tr key={i} className={!item.includedInPeakPower ? 'bg-slate-50/50' : ''}>
                  <td className="p-4 text-sm font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      {item.name}
                      {!item.includedInPeakPower && (
                        // Fix: Removed unsupported 'title' prop from AlertCircle and wrapped it in a span with the title attribute
                        <span title="Exclu de la puissance crête">
                          <AlertCircle size={12} className="text-slate-400" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-center font-medium text-slate-500">{item.quantity}</td>
                  <td className={`p-4 text-sm text-center font-medium ${!item.includedInPeakPower ? 'text-slate-300 line-through' : 'text-slate-500'}`}>
                    {item.powerW}W
                  </td>
                  <td className="p-4 text-sm text-center font-black text-blue-600">{item.dailyKWh.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Résumé Énergétique */}
        <div className="bg-blue-50 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Consommation Journalière</h4>
            <p className="text-3xl font-black text-blue-700">{data.totalDailyKWh.toFixed(2)} <span className="text-sm font-bold">kWh/jour</span></p>
          </div>
          <div className="text-right">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Puissance de Crête Totale</h4>
            <p className="text-xl font-black text-blue-900">{data.totalMaxW.toLocaleString()} W</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 print:hidden">
          <button 
            onClick={handlePrint}
            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Printer size={18} /> Imprimer l'offre
          </button>
          <button className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors">
            <Download size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;
