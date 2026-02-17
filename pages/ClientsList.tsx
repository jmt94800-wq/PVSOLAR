
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { Client } from '../types';
import { Plus, Search, User, Mail, Phone, ChevronRight, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  const loadClients = async () => {
    const all = await db.clients.toArray();
    setClients(all.sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // Added missing updatedAt and agentId properties to satisfy Client interface
    const newClient: Client = {
      id: uuidv4(),
      name,
      email,
      phone,
      company,
      notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      agentId: localStorage.getItem('solar_agent_name') || 'Personnel'
    };

    await db.clients.add(newClient);
    setName(''); setEmail(''); setPhone(''); setCompany(''); setNotes('');
    setShowModal(false);
    loadClients();
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Mes Clients</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white p-2 rounded-xl shadow-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Rechercher un client..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredClients.map((client) => (
          <Link 
            key={client.id}
            to={`/clients/${client.id}`}
            className="block bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                <User size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{client.name}</h3>
                <div className="flex gap-3 mt-1">
                  {client.phone && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone size={10} /> {client.phone}
                    </span>
                  )}
                  {client.email && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail size={10} /> {client.email}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </Link>
        ))}
        {filteredClients.length === 0 && (
          <div className="text-center py-10 text-slate-400 italic">
            Aucun client trouvé
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Nouveau Client</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddClient} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom complet *</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Entreprise</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Ma Société SARL"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Commentaire client</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-24"
                  placeholder="Infos particulières, historique..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-lg active:scale-[0.98]"
              >
                Enregistrer le client
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsList;
