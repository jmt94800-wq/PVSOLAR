
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { Visit, Client, Device } from '../types';
import { 
  ClipboardList, Users, Zap, ChevronRight, 
  Calendar as CalendarIcon, PackageOpen, Database, Cloud
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<{
    clients: Client[];
    visits: Visit[];
    devices: Device[];
  }>({ clients: [], visits: [], devices: [] });
  
  const teamId = localStorage.getItem('solar_team_id') || 'Personnel';

  useEffect(() => {
    const loadAll = async () => {
      const [clients, visits, devices] = await Promise.all([
        db.clients.toArray(),
        db.visits.toArray(),
        db.devices.toArray()
      ]);
      setData({ clients, visits, devices });
    };
    loadAll();
  }, []);

  const upcomingVisits = useMemo(() => {
    return data.visits
      .filter(v => v.status === 'SCHEDULED' && new Date(v.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)
      .map(v => ({
        ...v,
        client: data.clients.find(c => c.id === v.clientId)
      }));
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Team Status Indicator */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 shadow-sm">
          <Cloud size={14} className="text-blue-500" />
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Équipe : {teamId}</span>
        </div>
        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Données synchronisées localement</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-2xl font-bold">{data.clients.length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold text-center">Clients Total</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-600">{upcomingVisits.length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold text-center">Mes RV</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-2xl font-bold text-green-600">{data.visits.filter(v => v.status === 'COMPLETED').length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold text-center">Terminées</span>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarIcon size={18} className="text-blue-500" />
            Agenda Partagé
          </h2>
          <Link to="/calendar" className="text-blue-600 text-xs font-bold uppercase">Tout voir</Link>
        </div>

        <div className="space-y-3">
          {upcomingVisits.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs italic">
              Aucune visite prévue pour l'équipe
            </div>
          ) : (
            upcomingVisits.map((visit) => (
              <Link key={visit.id} to={`/visits/${visit.id}`} className="block bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center transition-transform active:scale-[0.98]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{visit.client?.name}</h3>
                    {visit.agentName && (
                       <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase">Par {visit.agentName}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(visit.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <PackageOpen size={18} className="text-orange-500" />
          Performance Équipe
        </h2>
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[32px] text-white shadow-xl shadow-blue-200">
           <p className="text-xs font-bold text-blue-100 uppercase tracking-widest opacity-80">Total Interventions</p>
           <h4 className="text-4xl font-black mt-1">{data.visits.length} <span className="text-sm font-medium opacity-60">Visites</span></h4>
           <div className="mt-6 flex justify-between items-end border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-60">Clients suivis</p>
                <p className="text-lg font-bold">{data.clients.length}</p>
              </div>
              <Link to="/export" className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase">Consulter les rapports</Link>
           </div>
        </div>
      </section>

      <div className="h-4" />
    </div>
  );
};

export default Dashboard;
