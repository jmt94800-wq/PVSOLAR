
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
  CheckCircle2
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
        agentName: localStorage.getItem('solar_agent_name'),
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SolarVisit_RESTORE_FILE_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la création du fichier de sauvegarde.");
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

        // Validation simple de la structure
        if (!data.clients || !data.visits || !data.devices) {
          throw new Error("Format de fichier invalide");
        }

        if (!window.confirm("ATTENTION : Cette action va supprimer toutes les données actuelles de l'application et les remplacer par le contenu du fichier. Continuer ?")) {
          setImportStatus('idle');
          return;
        }

        // Restauration dans une transaction
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

        // Restauration des paramètres locaux
        if (data.teamId) localStorage.setItem('solar_team_id', data.teamId);
        if (data.agentName) localStorage.setItem('solar_agent_name', data.agentName);

        setImportStatus('success');
        setTimeout(() => window.location.reload(), 1500); // Rechargement pour rafraîchir tous les contextes
      } catch (err) {
        console.error(err);
        setImportStatus('error');
        alert("Erreur lors de l'importation : Le fichier est peut-être corrompu ou invalide.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">Équipe & Maintenance</h2>
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

      {/* SECTION EXPORT */}
      <div className="grid gap-3">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Exports de données</h3>
        
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
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Database size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-black text-slate-800 text-sm">Fichier de Restauration (.json)</h3>
            <p className="text-[10px] text-slate-400 font-medium">Contient TOUTE la base de données.</p>
          </div>
        </button>
      </div>

      {/* SECTION MAINTENANCE / IMPORT */}
      <section className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest">Maintenance & Restauration</h3>
        </div>

        <p className="text-[10px] text-slate-500 leading-relaxed italic px-1">
          Utilisez cette section uniquement pour reconstruire votre application à partir d'un fichier de sauvegarde précédemment exporté.
        </p>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json" 
          onChange={handleImportFile} 
        />

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={importStatus === 'loading'}
          className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-dashed transition-all active:scale-95 ${
            importStatus === 'success' 
              ? 'bg-green-50 border-green-200 text-green-600' 
              : 'bg-white border-slate-200 text-slate-400 hover:border-amber-200 hover:text-amber-600'
          }`}
        >
          {importStatus === 'loading' ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : importStatus === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <FileUp size={18} />
          )}
          {importStatus === 'loading' ? 'Importation en cours...' : importStatus === 'success' ? 'Restauré avec succès !' : 'Importer une sauvegarde'}
        </button>

        {importStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold">
            <AlertCircle size={14} /> Une erreur est survenue lors de l'importation.
          </div>
        )}
      </section>
    </div>
  );
};

export default ExportPage;
