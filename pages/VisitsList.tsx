
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Visit, Client, Address } from '../types';
import { Plus, Search, ClipboardList, Calendar, MapPin, ChevronRight, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const VisitsList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialClientId = location.state?.clientId || '';

  const [visits, setVisits] = useState<(Visit & { client?: Client; address?: Address })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [visitDate, setVisitDate] = useState('');

  const loadData = async () => {
    const allVisits = await db.visits.toArray();
    const enriched = await Promise.all(allVisits.map(async (v) => {
      const client = await db.clients.get(v.clientId);
      const address = await db.addresses.get(v.addressId);
      return { ...v, client, address };
    }));
    setVisits(enriched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    const allClients = await db.clients.toArray();
    setClients(allClients.sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    loadData();
    if (initialClientId) setShowModal(true);
  }, [initialClientId]);

  useEffect(() => {
    const loadAddresses = async () => {
      if (selectedClientId) {
        const addr = await db.addresses.where('clientId').equals(selectedClientId).toArray();
        setAddresses(addr);
        if (addr.length > 0) setSelectedAddressId(addr[0].id);
        else setSelectedAddressId('');
      } else {
        setAddresses([]);
        setSelectedAddressId('');
      }
    };
    loadAddresses();
  }, [selectedClientId]);

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedAddressId || !visitDate) return;

    // Added missing updatedAt and agentName properties to satisfy Visit interface
    const newVisit: Visit = {
      id: uuidv4(),
      clientId: selectedClientId,
      addressId: selectedAddressId,
      date: visitDate,
      status: 'SCHEDULED',
      requirements: [],
      photos: [],
      notes: '',
      report: '',
      updatedAt: Date.now(),
      agentName: localStorage.getItem('solar_agent_name') || 'Personnel'
    };

    await db.visits.add(newVisit);
    setShowModal(false);
    navigate(`/visits/${newVisit.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Mes Visites</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white p-2 rounded-xl shadow-md"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-3">
        {visits.map((visit) => (
          <Link 
            key={visit.id}
            to={`/visits/${visit.id}`}
            className="block bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${visit.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <h3 className="font-bold text-slate-800">{visit.client?.name || 'Client inconnu'}</h3>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar size={12} /> 
                  {new Date(visit.date).toLocaleString('fr-FR', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={12} /> 
                  {visit.address?.label}: {visit.address?.street}
                </p>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </Link>
        ))}
        {visits.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
            <ClipboardList className="mx-auto text-slate-200 mb-2" size={48} />
            <p className="text-slate-400 text-sm italic">Aucune visite enregistrée</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Planifier une visite</h3>
              <button onClick={() => setShowModal(false)}><X size={24} className="text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleCreateVisit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sélectionner un client</label>
                <select 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {selectedClientId && addresses.length > 0 ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Lieu de la visite</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {addresses.map(a => <option key={a.id} value={a.id}>{a.label}: {a.street}</option>)}
                  </select>
                </div>
              ) : selectedClientId && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-700">Veuillez d'abord ajouter une adresse à ce client.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date et heure</label>
                <input 
                  required
                  type="datetime-local" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                />
              </div>
              
              <button 
                type="submit"
                disabled={!selectedClientId || !selectedAddressId || !visitDate}
                className="w-full bg-blue-600 disabled:bg-slate-300 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-lg active:scale-[0.98]"
              >
                Créer le rendez-vous
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsList;