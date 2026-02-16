
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Visit, Client } from '../types';
import { ChevronLeft, ChevronRight, User, ArrowLeft, Filter } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const TeamCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visits, setVisits] = useState<(Visit & { client?: Client })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVisits = async () => {
      setLoading(true);
      const all = await db.visits.toArray();
      const enriched = await Promise.all(all.map(async v => {
        const client = await db.clients.get(v.clientId);
        return { ...v, client };
      }));
      setVisits(enriched);
      setLoading(false);
    };
    loadVisits();
  }, []);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const renderCells = () => {
    const totalDays = daysInMonth(currentDate);
    const startOffset = startDayOfMonth(currentDate);
    const cells = [];

    // Empty cells for padding
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="h-28 border-b border-r border-slate-100 bg-slate-50/30"></div>);
    }

    // Days with visits
    for (let day = 1; day <= totalDays; day++) {
      const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
      const dayVisits = visits.filter(v => v.date.startsWith(dateString));
      const isToday = new Date().toISOString().split('T')[0] === dateString;

      cells.push(
        <div key={day} className={`h-28 border-b border-r border-slate-100 p-1.5 relative overflow-hidden group hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/20' : ''}`}>
          <span className={`text-[10px] font-black tracking-widest ${isToday ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-lg shadow-sm' : 'text-slate-400'}`}>
            {day}
          </span>
          <div className="mt-2 space-y-1">
            {dayVisits.map((v, i) => (
              <Link 
                key={v.id} 
                to={`/visits/${v.id}`} 
                className={`block text-[7px] font-black truncate rounded-md px-1 py-1 leading-tight shadow-sm border ${v.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}
              >
                <span className="uppercase opacity-60">[{v.agentName?.split(' ')[0] || '?'}]</span> {v.client?.name.split(' ')[0]}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Agenda d'Équipe</h2>
        <div className="w-10" />
      </div>

      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
        <span className="font-black text-slate-700 uppercase tracking-widest text-sm">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronRight size={20} /></button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {dayNames.map(d => (
            <div key={d} className="py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 no-scrollbar">
          {renderCells()}
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Filter size={12} /> Légende Supervision
        </h3>
        <div className="grid grid-cols-2 gap-4">
           <div className="flex items-center gap-3">
             <div className="w-4 h-4 rounded-md bg-blue-100 border border-blue-200" />
             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Visite à venir</span>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-4 h-4 rounded-md bg-green-100 border border-green-200" />
             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Visite terminée</span>
           </div>
        </div>
        <p className="mt-4 text-[9px] text-slate-400 font-medium italic border-t border-slate-50 pt-4 text-center">
          Le nom entre crochets [NOM] indique l'agent responsable.
        </p>
      </div>
    </div>
  );
};

export default TeamCalendar;
