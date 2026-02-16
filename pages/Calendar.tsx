
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { Visit, Client } from '../types';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visits, setVisits] = useState<(Visit & { client?: Client })[]>([]);

  useEffect(() => {
    const loadVisits = async () => {
      const all = await db.visits.toArray();
      const enriched = await Promise.all(all.map(async v => {
        const client = await db.clients.get(v.clientId);
        return { ...v, client };
      }));
      setVisits(enriched);
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
      cells.push(<div key={`empty-${i}`} className="h-20 border-b border-r border-slate-100"></div>);
    }

    // Days with visits
    for (let day = 1; day <= totalDays; day++) {
      const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
      const dayVisits = visits.filter(v => v.date.startsWith(dateString));
      const isToday = new Date().toISOString().split('T')[0] === dateString;

      cells.push(
        <div key={day} className={`h-20 border-b border-r border-slate-100 p-1 relative overflow-hidden ${isToday ? 'bg-blue-50/30' : ''}`}>
          <span className={`text-[10px] font-bold ${isToday ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>
            {day}
          </span>
          <div className="mt-1 space-y-0.5">
            {dayVisits.map((v, i) => (
              <Link 
                key={v.id} 
                to={`/visits/${v.id}`} 
                className={`block text-[8px] font-bold truncate rounded-sm px-1 py-0.5 ${v.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
              >
                {v.client?.name.split(' ')[0]}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Agenda Visites</h2>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><ChevronLeft size={20} /></button>
          <span className="font-bold text-slate-700">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button onClick={nextMonth} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {dayNames.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {renderCells()}
        </div>
      </div>

      <div className="flex gap-4 justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-1.5"><Circle size={8} className="fill-blue-500 text-blue-500" /> À venir</div>
        <div className="flex items-center gap-1.5"><Circle size={8} className="fill-green-500 text-green-500" /> Terminée</div>
      </div>
    </div>
  );
};

export default Calendar;
