
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../db';
import { Client, Address, Visit } from '../types';
import { 
  ArrowLeft, MapPin, Plus, Trash2, 
  Mail, Phone, Building2, ClipboardList,
  ChevronRight, User, Save, FileText, Loader2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ClientDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [label, setLabel] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');

  const [clientNotes, setClientNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const [c, addr, v] = await Promise.all([
      db.clients.get(id),
      db.addresses.where('clientId').equals(id).toArray(),
      db.visits.where('clientId').equals(id).toArray()
    ]);

    if (!c) return navigate('/clients');
    
    setClient(c);
    setClientNotes(c.notes || '');
    setAddresses(addr);
    setVisits(v.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    loadData();
  }, [id, navigate]);

  const handleUpdateNotes = async () => {
    if (!client || !id) return;
    setIsUpdatingNotes(true);
    await db.clients.update(id, { notes: clientNotes });
    setClient({ ...client, notes: clientNotes });
    setIsUpdatingNotes(false);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !label || !street) return;

    const newAddress: Address = {
      id: uuidv4(),
      clientId: id,
      label,
      street,
      zip,
      city
    };

    await db.addresses.add(newAddress);
    setLabel(''); setStreet(''); setZip(''); setCity('');
    setShowAddressModal(false);
    loadData();
  };

  const handleDeleteClient = async () => {
    if (!id || !window.confirm('Supprimer ce client ?')) return;
    await db.clients.delete(id);
    await db.addresses.where('clientId').equals(id).delete();
    await db.visits.where('clientId').equals(id).delete();
    navigate('/clients');
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!window.confirm('Supprimer cette adresse ?')) return;
    await db.addresses.delete(addrId);
    loadData();
  };

  if (!client) return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/clients')} className="p-2 -ml-2 text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <button onClick={handleDeleteClient} className="text-red-500 p-2 bg-red-50 rounded-xl">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 leading-tight">{client.name}</h2>
            {client.company && (
              <p className="flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider">
                <Building2 size={14} /> {client.company}
              </p>
            )}
          </div>
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <User size={32} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-black text-slate-400">Téléphone</span>
            <p className="text-sm font-bold text-slate-700 flex items-center gap-2 mt-0.5">
               {client.phone || '-'}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-black text-slate-400">Email</span>
            <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">
               {client.email || '-'}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
           <div className="flex justify-between items-center px-1">
             <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1">
               <FileText size={12} /> Dossier Client (Commentaire)
             </span>
             {clientNotes !== (client.notes || '') && (
               <button onClick={handleUpdateNotes} disabled={isUpdatingNotes} className="text-[10px] text-blue-600 font-black flex items-center gap-1 uppercase bg-blue-50 px-2 py-1 rounded-lg">
                 {isUpdatingNotes ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                 Mettre à jour
               </button>
             )}
           </div>
           <textarea 
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 min-h-[100px] transition-all"
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="Historique du client, particularités du dossier..."
           />
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <MapPin size={16} className="text-red-500" />
            Adresses ({addresses.length})
          </h3>
          <button onClick={() => setShowAddressModal(true)} className="text-blue-600 p-1.5 bg-blue-50 rounded-xl">
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {addresses.map(addr => (
            <div key={addr.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group transition-all hover:border-blue-200">
              <div>
                <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">{addr.label}</span>
                <p className="font-bold text-slate-800 text-sm mt-1.5">{addr.street}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{addr.zip} {addr.city}</p>
              </div>
              <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 text-slate-200 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {addresses.length === 0 && (
            <p className="text-center py-6 text-slate-300 text-xs italic font-medium">Aucune adresse enregistrée</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <ClipboardList size={16} className="text-green-500" />
            Interventions ({visits.length})
          </h3>
          <Link to="/visits" state={{ clientId: id }} className="text-blue-600 p-1.5 bg-blue-50 rounded-xl">
            <Plus size={18} />
          </Link>
        </div>

        <div className="space-y-2">
          {visits.map(visit => (
            <Link key={visit.id} to={`/visits/${visit.id}`} className="block bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all active:scale-98">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${visit.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'} shadow-sm`} />
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {new Date(visit.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {visit.status === 'COMPLETED' ? 'Clôturée' : 'À venir'} • {visit.requirements?.length || 0} équipements
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-200" />
              </div>
            </Link>
          ))}
          {visits.length === 0 && (
            <p className="text-center py-6 text-slate-300 text-xs italic font-medium">Aucune visite pour ce client</p>
          )}
        </div>
      </section>

      {/* MODAL ADRESSE */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddressModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-black mb-8 text-slate-800">Ajouter un lieu</h3>
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Nom du lieu</label>
                <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" placeholder="ex: Résidence principale" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Rue</label>
                <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">CP</label>
                  <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Ville</label>
                  <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg mt-4 shadow-xl shadow-blue-200 active:scale-95 transition-all">
                Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;
