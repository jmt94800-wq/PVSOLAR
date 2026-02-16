
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Visit, Client, Address, Device, VisitRequirement } from '../types';
import { compressImage } from '../utils/image';
import { 
  ArrowLeft, Camera, Trash2, Plus, Minus, 
  CheckCircle, Zap, Save, FileText, Image as ImageIcon,
  MapPin, Notebook, Loader2
} from 'lucide-react';

const VisitDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visit, setVisit] = useState<Visit | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [catalogue, setCatalogue] = useState<Device[]>([]);
  const [requirements, setRequirements] = useState<VisitRequirement[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [report, setReport] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const v = await db.visits.get(id);
      if (!v) return navigate('/visits');
      
      setVisit(v);
      setRequirements(v.requirements || []);
      setPhotos(v.photos || []);
      setNotes(v.notes || '');
      setReport(v.report || '');

      const c = await db.clients.get(v.clientId);
      if (c) setClient(c);
      const a = await db.addresses.get(v.addressId);
      if (a) setAddress(a);

      const allDevices = await db.devices.toArray();
      setCatalogue(allDevices);
    };
    loadData();
  }, [id, navigate]);

  const handleUpdateRequirement = (deviceId: string, delta: number) => {
    setRequirements(prev => {
      const existing = prev.find(r => r.deviceId === deviceId);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) return prev.filter(r => r.deviceId !== deviceId);
        return prev.map(r => r.deviceId === deviceId ? { ...r, quantity: newQty } : r);
      } else if (delta > 0) {
        return [...prev, { deviceId, quantity: delta }];
      }
      return prev;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setIsCompressing(true);
    // Fixed: Cast the array from FileList to File[] to ensure individual items are recognized as Blobs
    const fileList = Array.from(files) as File[];
    
    for (const file of fileList) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      const compressed = await compressImage(base64);
      setPhotos(prev => [...prev, compressed]);
    }
    setIsCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (complete: boolean = false) => {
    if (!id || !visit) return;
    setIsSaving(true);

    const updatedVisit: Visit = {
      ...visit,
      requirements,
      photos,
      notes,
      report,
      status: complete ? 'COMPLETED' : visit.status
    };

    await db.visits.put(updatedVisit);
    setVisit(updatedVisit);
    setIsSaving(false);
    if (complete) navigate('/visits');
  };

  if (!visit || !client) return null;

  const totalConsumption = requirements.reduce((acc, req) => {
    const dev = catalogue.find(d => d.id === req.deviceId);
    if (!dev) return acc;
    return acc + (dev.hourlyPower * dev.usageDuration * req.quantity);
  }, 0);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between sticky top-14 bg-slate-50/90 backdrop-blur-md py-2 z-30">
        <button onClick={() => navigate('/visits')} className="p-2 -ml-2 text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
           <button 
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="text-blue-600 bg-white border border-blue-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
            Sauvegarder
          </button>
          {visit.status !== 'COMPLETED' && (
            <button 
              onClick={() => handleSave(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <CheckCircle size={16} /> Clôturer
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <div>
          <h2 className="text-xl font-black text-slate-800">{client.name}</h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <MapPin size={12} className="text-red-500" />
            <span className="font-medium underline decoration-red-200">{address?.label}: {address?.street}</span>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <div className="flex-1 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Énergie Est.</span>
            <p className="text-xl font-black text-blue-600 leading-tight">{totalConsumption.toFixed(1)} <span className="text-[10px] font-medium text-blue-400">kWh/j</span></p>
          </div>
          <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matériels</span>
            <p className="text-xl font-black text-slate-800 leading-tight">{requirements.reduce((a, b) => a + b.quantity, 0)} <span className="text-[10px] font-medium text-slate-400">unités</span></p>
          </div>
        </div>
      </div>

      {/* REQUIREMENTS */}
      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest px-1">Besoins du Client</h3>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
          {catalogue.map((device) => {
            const req = requirements.find(r => r.deviceId === device.id);
            const qty = req?.quantity || 0;
            return (
              <div key={device.id} className="p-4 flex items-center justify-between transition-colors hover:bg-slate-50/50">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{device.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{device.hourlyPower}kW • {device.usageDuration}h/j</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button onClick={() => handleUpdateRequirement(device.id, -1)} className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 active:scale-95 transition-transform">
                    <Minus size={14} />
                  </button>
                  <span className={`w-4 text-center font-black text-sm ${qty > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{qty}</span>
                  <button onClick={() => handleUpdateRequirement(device.id, 1)} className="w-8 h-8 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200 flex items-center justify-center active:scale-95 transition-transform">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PHOTOS */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Photos du Site ({photos.length})</h3>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isCompressing}
            className="text-blue-600 text-[10px] font-black bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-1.5 uppercase tracking-wider disabled:opacity-50"
          >
            {isCompressing ? <Loader2 size={12} className="animate-spin" /> : <Camera size={14} />} 
            Ajouter
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, idx) => (
            <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden shadow-sm group bg-slate-200">
              <img src={photo} alt={`Site ${idx}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => handleRemovePhoto(idx)} 
                className="absolute top-1 right-1 p-1.5 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-white rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 text-slate-300 hover:text-blue-300 hover:border-blue-200 transition-colors">
            <Plus size={24} />
          </button>
        </div>
      </section>

      {/* REPORT */}
      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest px-1 flex items-center gap-2">
          <Notebook size={14} className="text-green-600" />
          Rapport de Visite Formel
        </h3>
        <textarea 
          className="w-full h-48 bg-white p-5 rounded-3xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
          placeholder="Détaillez ici l'état de l'installation, les préconisations techniques, les obstacles éventuels..."
          value={report}
          onChange={(e) => setReport(e.target.value)}
        />
      </section>

      {/* QUICK NOTES */}
      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest px-1 flex items-center gap-2">
          <FileText size={14} className="text-slate-400" />
          Observations rapides
        </h3>
        <input 
          type="text"
          className="w-full bg-white px-5 py-4 rounded-2xl border border-slate-200 text-sm outline-none shadow-sm"
          placeholder="Notes de terrain..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>
    </div>
  );
};

export default VisitDetail;
