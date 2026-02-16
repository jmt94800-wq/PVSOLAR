
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { Visit, Client, Device } from '../types';
import { 
  ClipboardList, Users, Zap, ChevronRight, 
  Calendar as CalendarIcon, PackageOpen, Database 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<{
    clients: Client[];
    visits: Visit[];
    devices: Device[];
  }>({ clients: [], visits: [], devices: [] });

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

  // Calcul des besoins par client (mémoïsé pour la performance)
  const clientNeedsSummary = useMemo(() => {
    const summary = data.clients.map(client => {
      const clientVisits = data.visits.filter(v => v.clientId === client.id);
      const deviceTotals = new Map<string, number>();

      clientVisits.forEach(v => {
        v.requirements.forEach(req => {
          deviceTotals.set(req.deviceId, (deviceTotals.get(req.deviceId) || 0) + req.quantity);
        });
      });

      const items = Array.from(deviceTotals.entries()).map(([deviceId, qty]) => ({
        device: data.devices.find(d => d.id === deviceId),
        qty
      })).filter(i => i.device && i.qty > 0);

      return { client, items };
    }).filter(s => s.items.length > 0);

    return summary;
  }, [data]);

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
      {/* Offline Status Indicator */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full w-fit mx-auto border border-slate-200">
        <Database size={12} className="text-green-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Mode Local Activé • {data.visits.length} Visites en mémoire</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-2xl font-bold">{data.clients.length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Clients</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-600">{upcomingVisits.length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">À venir</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-2xl font-bold text-green-600">{data.visits.filter(v => v.status === 'COMPLETED').length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Terminées</span>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarIcon size={18} className="text-blue-500" />
            Agenda Prochain
          </h2>
          <Link to="/calendar" className="text-blue-600 text-xs font-bold uppercase">Tout voir</Link>
        </div>

        <div className="space-y-3">
          {upcomingVisits.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs italic">
              Aucune visite prévue
            </div>
          ) : (
            upcomingVisits.map((visit) => (
              <Link key={visit.id} to={`/visits/${visit.id}`} className="block bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800">{visit.client?.name}</h3>
                  <p className="text-xs text-slate-500">{new Date(visit.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
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
          État global des besoins par client
        </h2>
        
        <div className="space-y-4">
          {clientNeedsSummary.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center">
              <p className="text-slate-400 text-sm italic">Aucun matériel listé pour le moment</p>
            </div>
          ) : (
            clientNeedsSummary.map(({ client, items }) => (
              <div key={client.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-l-4 border-l-blue-500">
                <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-sm font-extrabold text-slate-700">{client.name}</h3>
                  <Link to={`/clients/${client.id}`} className="p-1 text-blue-500"><ChevronRight size={14}/></Link>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {items.map(({ device, qty }) => (
                    <div key={device?.id} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-black bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-lg">{qty}</span>
                      <span className="text-xs font-bold">{device?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="h-4" /> {/* Spacer */}
    </div>
  );
};

export default Dashboard;
