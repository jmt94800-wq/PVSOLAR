
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { FileDown, Database, AlertCircle, Cloud, User, ShieldCheck, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState(localStorage.getItem('solar_team_id') || '');
  const [agentName, setAgentName] = useState(localStorage.getItem('solar_agent_name') || '');
  const [isSyncing, setIsSyncing] = useState(false);

  const saveConfig = () => {
    localStorage.setItem('solar_team_id', teamId);
    localStorage.setItem('solar_agent_name', agentName);
    alert('Configuration enregistrée !');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
    alert('Synchronisation terminée (Simulation).');
  };

  const exportToExcel = async () => {
    setLoading(true);
    try {
      const clients = await db.clients.toArray();
      const visits = await db.visits.toArray();
      const devices = await db.devices.toArray();
      const addresses = await db.addresses.toArray();

      const workbook = XLSX.utils.book_new();

      // Clients sheet
      const clientsData = clients.map(c => ({
        ID_Client: c.id,
        Equipe: localStorage.getItem('solar_team_id') || 'N/A',
        Agent: c.agentId || 'Inconnu',
        Nom: c.name,
        Email: c.email,
        Telephone: c.phone,
        Entreprise: c.company || '',
        Commentaire: c.notes || '',
        Cree_le: new Date(c.createdAt).toLocaleString()
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(clientsData), "Clients");

      // Visits sheet
      const visitsData = await Promise.all(visits.map(async v => {
        const client = clients.find(c => c.id === v.clientId);
        const addr = addresses.find(a => a.id === v.addressId);
        return {
          ID_Visite: v.id,
          Equipe: localStorage.getItem('solar_team_id') || 'N/A',
          Agent: v.agentName || 'Inconnu',
          Client: client?.name || 'Inconnu',
          Lieu: addr ? `${addr.label}: ${addr.street}, ${addr.city}` : 'Inconnu',
          Date: new Date(v.date).toLocaleString(),
          Statut: v.status,
          Note_Terrain: v.notes || '',
          Rapport_Formel: v.report || ''
        };
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(visitsData), "Visites");

      // Detailed Equipment Requirements sheet
      const equipmentDetails: any[] = [];
      for (const v of visits) {
        const client = clients.find(c => c.id === v.clientId);
        for (const req of v.requirements) {
          const baseDevice = devices.find(d => d.id === req.deviceId);
          if (!baseDevice) continue;

          equipmentDetails.push({
            ID_Visite: v.id,
            Client: client?.name || 'Inconnu',
            Date_Visite: new Date(v.date).toLocaleDateString(),
            Appareil: req.overrideName || baseDevice.name,
            Quantite: req.quantity,
            Puissance_Max_W: req.overrideMaxPower ?? baseDevice.maxPower,
            Conso_Horaire_kWh: req.overrideHourlyPower ?? baseDevice.hourlyPower,
            Duree_Utilisation_h_j: req.overrideUsageDuration ?? baseDevice.usageDuration,
            Total_Journalier_kWh: (req.overrideHourlyPower ?? baseDevice.hourlyPower) * 
                                  (req.overrideUsageDuration ?? baseDevice.usageDuration) * 
                                  req.quantity
          });
        }
      }
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(equipmentDetails), "Détails_Equipements");

      XLSX.writeFile(workbook, `SolarVisit_Pro_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const exportDB = async () => {
    setLoading(true);
    try {
      const data = {
        clients: await db.clients.toArray(),
        addresses: await db.addresses.toArray(),
        devices: await db.devices.toArray(),
        visits: await db.visits.toArray(),
        teamId: localStorage.getItem('solar_team_id'),
        agentName: localStorage.getItem('solar_agent_name')
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SolarVisit_Backup_${Date.now()}.json`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">Équipe & Export</h2>
      </div>

      <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
          <ShieldCheck size={18} /> Configuration Équipe
        </h3>
        
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Nom de l'Agent (Vous)</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ex: Marc" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">ID de l'Équipe</label>
            <div className="relative">
              <Cloud size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ex: SOLAR-FORCE-2024" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={saveConfig}
              className="bg-slate-800 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-200"
            >
              Enregistrer
            </button>
            <button 
              onClick={handleSync}
              disabled={!teamId || isSyncing}
              className="bg-blue-600 disabled:bg-slate-200 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Synchroniser
            </button>
          </div>
        </div>
      </section>

      <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100 flex gap-4 items-start">
        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-amber-900 text-sm">Rapport Complet</h4>
          <p className="text-amber-700 text-[10px] mt-1 leading-relaxed font-medium">
            L'export inclut désormais le détail précis de chaque équipement par client pour vos devis photovoltaïques.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <button 
          onClick={exportToExcel}
          disabled={loading}
          className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all active:scale-95"
        >
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <FileDown size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-black text-slate-800 text-sm">Export Excel d'Équipe</h3>
            <p className="text-[10px] text-slate-400 font-medium">Synthèse complète + détails équipements.</p>
          </div>
        </button>

        <button 
          onClick={exportDB}
          disabled={loading}
          className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all active:scale-95"
        >
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
            <Database size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-black text-slate-800 text-sm">Sauvegarde JSON</h3>
            <p className="text-[10px] text-slate-400 font-medium">Format technique pour restauration complète.</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ExportPage;
