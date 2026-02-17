
import React, { useState, useRef } from 'react';
import { db } from '../db';
import { 
  FileDown, 
  Database, 
  AlertCircle, 
  Cloud, 
  User, 
  ShieldCheck, 
  RefreshCw, 
  FileUp, 
  AlertTriangle,
  CheckCircle2,
  HardDriveDownload
} from 'lucide-react';
import * as XLSX from 'xlsx';

const ExportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState(localStorage.getItem('solar_team_id') || '');
  const [agentName, setAgentName] = useState(localStorage.getItem('solar_agent_name') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      XLSX.writeFile(workbook, `SolarVisit_Pro_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const exportFullDB = async () => {
    setLoading(true);
    try {
      const data = {
        clients: await db.clients.toArray(),
        addresses: await db.addresses.toArray(),
        devices: await db.devices.toArray(),
        visits: await db.visits.toArray(),
        teamId: localStorage.getItem('solar_team_id'),
        agentName: localStorage.getItem('solar_agent_name'),
        exportDate: new Date().toISOString(),
        version: "1.0"
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SolarVisit_Data_${new Date().toISOString().split('T')[0]}.db`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'extraction de la base de données.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setImportStatus('loading');
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.clients || !data.visits || !data.devices) {
          throw new Error("Format de fichier invalide");
        }

        if (!window.confirm("Remplacer TOUTES les données actuelles par le contenu de ce fichier ?")) {
          setImportStatus('idle');
          return;
        }

        await db.transaction('rw', [db.clients, db.addresses, db.devices, db.visits], async () => {
          await db.clients.clear();
          await db.addresses.clear();
          await db.devices.clear();
          await db.visits.clear();
          if (data.clients.length > 0) await db.clients.bulkAdd(data.clients);
          if (data.addresses?.length > 0) await db.addresses.bulkAdd(data.addresses);
          if (data.devices.length > 0) await db.devices.bulkAdd(data.devices);
          if (data.visits.length > 0) await db.visits.bulkAdd(data.visits);
        });

        if (data.teamId) localStorage.setItem('solar_team_id', data.teamId);
        if (data.agentName) localStorage.setItem('solar_agent_name', data.agentName);

        setImportStatus('success');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setImportStatus('error');
        alert("Fichier corrompu ou invalide.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">Maintenance & Données</h2>
      </div>

      <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
          <ShieldCheck size={18} /> Profil Agent
        </h3>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Nom de l'Agent</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">ID Équipe</label>
            <div className="relative">
              <Cloud size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold" value={teamId} onChange={(e) => setTeamId(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={saveConfig} className="bg-slate-800 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg">Enregistrer</button>
            <button onClick={handleSync} disabled={isSyncing} className="bg-blue-600 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
              {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sync
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-3">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Extractions de données</h3>
        
        <button onClick={exportToExcel} disabled={loading} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all active:scale-95">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <FileDown size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-black text-slate-800 text-sm">Export Excel (.xlsx)</h3>
            <p className="text-[10px] text-slate-400 font-medium">Synthèse structurée pour vos rapports.</p>
          </div>
        </button>

        <button onClick={exportFullDB} disabled={loading} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all active:scale-95">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <HardDriveDownload size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-black text-slate-800 text-sm">Extraction Base de Données (.db)</h3>
            <p className="text-[10px] text-slate-400 font-medium">Sauvegarde intégrale pour restauration.</p>
          </div>
        </button>
      </div>

      <section className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest">Restauration</h3>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed italic px-1">Importez un fichier .db pour restaurer toutes vos données.</p>
        <input type="file" ref={fileInputRef} className="hidden" accept=".db,.json" onChange={handleImportFile} />
        <button onClick={() => fileInputRef.current?.click()} disabled={importStatus === 'loading'} className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-dashed transition-all active:scale-95 ${importStatus === 'success' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-200 text-slate-400'}`}>
          {importStatus === 'loading' ? <RefreshCw size={18} className="animate-spin" /> : importStatus === 'success' ? <CheckCircle2 size={18} /> : <FileUp size={18} />}
          {importStatus === 'loading' ? 'Restauration...' : importStatus === 'success' ? 'Terminé !' : 'Restaurer un fichier .db'}
        </button>
      </section>
    </div>
  );
};

export default ExportPage;
