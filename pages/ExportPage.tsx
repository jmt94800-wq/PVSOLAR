
import React, { useState } from 'react';
import { db } from '../db';
import { FileDown, Database, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

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
        ID: c.id,
        Nom: c.name,
        Email: c.email,
        Telephone: c.phone,
        Entreprise: c.company || '',
        Commentaire_Client: c.notes || '',
        Cree_le: new Date(c.createdAt).toLocaleString()
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(clientsData), "Clients");

      // Visits sheet
      const visitsData = await Promise.all(visits.map(async v => {
        const client = clients.find(c => c.id === v.clientId);
        const addr = addresses.find(a => a.id === v.addressId);
        return {
          ID: v.id,
          Client: client?.name || 'Inconnu',
          Lieu: addr ? `${addr.label}: ${addr.street}, ${addr.city}` : 'Inconnu',
          Date: new Date(v.date).toLocaleString(),
          Statut: v.status,
          Rapport_Visite: v.report || '',
          Observations: v.notes || ''
        };
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(visitsData), "Visites");

      // Requirements summary
      const requirementsData = visits.flatMap(v => {
        const client = clients.find(c => c.id === v.clientId);
        return v.requirements.map(req => {
          const device = devices.find(d => d.id === req.deviceId);
          return {
            ID_Visite: v.id,
            Client: client?.name || 'Inconnu',
            Appareil: device?.name || 'Inconnu',
            Quantite: req.quantity,
            Puis_Max: device?.maxPower || 0,
            Consommation_Horaire: device?.hourlyPower || 0,
            Total_Journalier_kWh: (device?.hourlyPower || 0) * (device?.usageDuration || 0) * req.quantity
          };
        });
      });
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(requirementsData), "Détails Besoins");

      XLSX.writeFile(workbook, `SolarVisit_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">Export des données</h2>
      </div>

      <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 flex gap-4 items-start">
        <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Stockage Local</h4>
          <p className="text-blue-700 text-xs mt-1 leading-relaxed">
            Toutes les données sont sur votre téléphone. Exportez régulièrement pour sécuriser vos rapports.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <button 
          onClick={exportToExcel}
          disabled={loading}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-blue-200 transition-all"
        >
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <FileDown size={32} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-slate-800">Export Excel (.xlsx)</h3>
            <p className="text-xs text-slate-500">Rapport complet avec commentaires et rapports de visite.</p>
          </div>
        </button>

        <button 
          onClick={exportDB}
          disabled={loading}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-blue-200 transition-all"
        >
          <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
            <Database size={32} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-slate-800">Sauvegarde Base (JSON)</h3>
            <p className="text-xs text-slate-500">Archive complète de l'application.</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ExportPage;
