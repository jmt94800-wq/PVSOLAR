
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Device } from '../types';
import { Zap, Plus, Trash2, X, Edit2, FileUp, Download, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

const Catalogue: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form
  const [name, setName] = useState('');
  const [maxPower, setMaxPower] = useState('');
  const [usageDuration, setUsageDuration] = useState('');
  const [hourlyPower, setHourlyPower] = useState('');
  const [includedInPeak, setIncludedInPeak] = useState(true);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    const all = await db.devices.toArray();
    setDevices(all.sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !maxPower || !usageDuration || !hourlyPower) return;

    const deviceData: Device = {
      id: editingId || uuidv4(),
      name,
      maxPower: Number(maxPower),
      usageDuration: Number(usageDuration),
      hourlyPower: Number(hourlyPower),
      defaultIncludedInPeakPower: includedInPeak,
      notes
    };

    if (editingId) await db.devices.put(deviceData);
    else await db.devices.add(deviceData);

    resetForm();
    setShowModal(false);
    loadData();
  };

  const handleEdit = (d: Device) => {
    setEditingId(d.id);
    setName(d.name);
    setMaxPower(d.maxPower.toString());
    setUsageDuration(d.usageDuration.toString());
    setHourlyPower(d.hourlyPower.toString());
    setIncludedInPeak(d.defaultIncludedInPeakPower ?? true);
    setNotes(d.notes || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName(''); setMaxPower(''); setUsageDuration(''); setHourlyPower(''); setIncludedInPeak(true); setNotes('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet appareil du catalogue ?')) return;
    await db.devices.delete(id);
    loadData();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        let importedData: any[] = [];

        if (file.name.endsWith('.json')) {
          importedData = JSON.parse(new TextDecoder().decode(data as ArrayBuffer));
        } else {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          importedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }

        const devicesToImport: Device[] = importedData.map((item: any) => {
          // Normalisation de la valeur "Puissance crète" (OUI/NON)
          const rawPeakValue = item['Puissance crète'] || item['Puissance crête'] || item.includedInPeakPower;
          const isPeak = typeof rawPeakValue === 'string' 
            ? rawPeakValue.toUpperCase() === 'OUI' 
            : !!rawPeakValue;

          return {
            id: uuidv4(),
            name: item.Nom || item.name || 'Appareil sans nom',
            maxPower: Number(item.Pmax || item.maxPower || 0),
            hourlyPower: Number(item.PWh || item.hourlyPower || 0),
            usageDuration: Number(item.durée || item.duration || item.usageDuration || 0),
            defaultIncludedInPeakPower: isPeak,
            notes: item.Commentaire || item.notes || ''
          };
        });

        if (devicesToImport.length > 0) {
          await db.devices.bulkAdd(devicesToImport);
          await loadData();
          alert(`${devicesToImport.length} appareils importés avec succès.`);
        }
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'importation. Vérifiez le format du fichier (Colonnes requises: Nom, Pmax, PWh, durée, Puissance crète, Commentaire).");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Catalogue Appareils</h2>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".json,.xlsx,.xls,.csv" onChange={handleImport} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-100 text-slate-600 p-2 rounded-xl border border-slate-200 hover:bg-slate-200 transition-colors"
            title="Importer (JSON/Excel)"
          >
            {isImporting ? <Loader2 size={24} className="animate-spin" /> : <FileUp size={24} />}
          </button>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 text-white p-2 rounded-xl shadow-md"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {devices.map((device) => (
          <div key={device.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                <Zap size={20} className="fill-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{device.name}</h3>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase">{device.maxPower}W Max</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${device.defaultIncludedInPeakPower ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    P. Crête: {device.defaultIncludedInPeakPower ? 'OUI' : 'NON'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(device)} className="p-2 text-slate-400"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(device.id)} className="p-2 text-red-300"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingId ? 'Modifier' : 'Ajouter'} un appareil</h3>
              <button onClick={() => setShowModal(false)}><X size={24} className="text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSaveDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom de l'appareil</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Puis. Max (W)</label>
                  <input required type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={maxPower} onChange={(e) => setMaxPower(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Duree util. (h/j)</label>
                  <input required type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={usageDuration} onChange={(e) => setUsageDuration(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Consommation horaire (kW/h)</label>
                <input required type="number" step="0.1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={hourlyPower} onChange={(e) => setHourlyPower(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input 
                  type="checkbox" 
                  id="incPeak" 
                  className="w-5 h-5 accent-blue-600"
                  checked={includedInPeak} 
                  onChange={(e) => setIncludedInPeak(e.target.checked)} 
                />
                <label htmlFor="incPeak" className="text-sm font-bold text-slate-700">Inclus dans la puissance crête par défaut</label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Commentaire</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-20"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-lg active:scale-[0.98]">
                {editingId ? 'Mettre à jour' : 'Ajouter au catalogue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalogue;
