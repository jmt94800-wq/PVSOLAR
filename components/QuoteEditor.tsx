
import React, { useState, useMemo } from 'react';
import { ClientProfile, ProspectEntry, QuoteConfig } from '../types';
import { calculateTotals, calculateSolarSpecs } from '../utils';

interface QuoteEditorProps {
  profile: ClientProfile;
  onSave: (updatedProfile: ClientProfile, config: QuoteConfig) => void;
  onPersist: (updatedProfile: ClientProfile, config: QuoteConfig) => void;
  onCancel: () => void;
}

export const QuoteEditor: React.FC<QuoteEditorProps> = ({ profile, onSave, onPersist, onCancel }) => {
  const [items, setItems] = useState<ProspectEntry[]>(() => {
    const baseItems = [...profile.items];
    const mandatoryLabels = ["Onduleur", "Panneau Solaire", "Batterie"];
    
    mandatoryLabels.forEach(label => {
      if (!baseItems.find(i => i.appareil.toLowerCase() === label.toLowerCase())) {
        baseItems.push({
          id: `mandatory-${label}-${Date.now()}`,
          client: profile.name,
          lieu: profile.siteName,
          adresse: profile.address,
          date: profile.visitDate,
          agent: profile.agentName,
          appareil: label,
          puissanceHoraireKWh: 0,
          puissanceMaxW: 0,
          dureeHj: 0,
          quantite: 1,
          inclusPuisCrete: false,
          unitPrice: 0
        });
      }
    });
    return baseItems;
  });

  const [localProfile, setLocalProfile] = useState<ClientProfile>(profile);

  const [config, setConfig] = useState<QuoteConfig>(profile.savedConfig || {
    marginPercent: 20,
    discountPercent: 0,
    materialTaxPercent: 20,
    installCost: 1500,
    installTaxPercent: 10,
    panelPowerW: 425,
    efficiencyPercent: 80
  });

  const [panelCountResult, setPanelCountResult] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const liveTotals = useMemo(() => calculateTotals(items), [items]);
  const liveSpecs = useMemo(() => calculateSolarSpecs(liveTotals.totalDailyKWh, config.panelPowerW, config.efficiencyPercent), [liveTotals.totalDailyKWh, config.panelPowerW, config.efficiencyPercent]);

  const updateItem = (id: string, field: keyof ProspectEntry, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let finalValue = value;
        if (typeof value === 'number') {
          finalValue = Math.max(0, value);
        }
        return { ...item, [field]: finalValue };
      }
      return item;
    }));
  };

  const addItem = () => {
    const newItem: ProspectEntry = {
      id: `manual-${Date.now()}`,
      client: profile.name,
      lieu: profile.siteName,
      adresse: profile.address,
      date: profile.visitDate,
      agent: localProfile.agentName,
      appareil: "Nouvel Appareil",
      puissanceHoraireKWh: 0.1,
      puissanceMaxW: 100,
      dureeHj: 2,
      quantite: 1,
      inclusPuisCrete: true,
      unitPrice: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleCalculatePanels = () => {
    setPanelCountResult(liveSpecs.panelCount);
  };

  const handleQuickSave = () => {
    setSaveStatus('saving');
    const updatedProfile = { 
      ...localProfile, 
      items, 
      totalDailyKWh: liveTotals.totalDailyKWh,
      totalMaxW: liveTotals.totalMaxW,
      savedAt: new Date().toISOString()
    };
    onPersist(updatedProfile, config);
    setTimeout(() => setSaveStatus('saved'), 600);
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleSubmit = () => {
    onSave({ 
      ...localProfile, 
      items, 
      totalDailyKWh: liveTotals.totalDailyKWh,
      totalMaxW: liveTotals.totalMaxW 
    }, config);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <button 
            onClick={onCancel}
            className="text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-2 hover:translate-x-[-4px] transition-transform"
          >
            <i className="fa-solid fa-arrow-left"></i> Sommaire
          </button>
          <h2 className="text-2xl font-black text-slate-900">Configuration du Devis</h2>
          <div className="flex items-center gap-2 mt-1">
             <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">HSP 5.2 • Rendement {config.efficiencyPercent}%</span>
             <p className="text-slate-500 text-sm">Projet pour {profile.name}.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleQuickSave} 
            disabled={saveStatus === 'saving'}
            className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border ${saveStatus === 'saved' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}
          >
            {saveStatus === 'saving' ? (
              <i className="fa-solid fa-circle-notch animate-spin"></i>
            ) : saveStatus === 'saved' ? (
              <i className="fa-solid fa-check"></i>
            ) : (
              <i className="fa-solid fa-floppy-disk"></i>
            )}
            {saveStatus === 'saved' ? 'Enregistré' : 'Sauvegarder'}
          </button>
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
            Générer le Devis ($)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Agent Responsable de la Visite</label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-slate-400"><i className="fa-solid fa-user-tie"></i></span>
            <input 
              type="text" 
              value={localProfile.agentName}
              onChange={(e) => setLocalProfile({...localProfile, agentName: e.target.value})}
              placeholder="Nom de l'agent..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observations Générales de l'Audit</label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-slate-400"><i className="fa-solid fa-comment-dots"></i></span>
            <textarea 
              rows={1}
              value={localProfile.observations}
              onChange={(e) => setLocalProfile({...localProfile, observations: e.target.value})}
              placeholder="Notes sur le site, l'ombrage, les souhaits client..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <i className="fa-solid fa-solar-panel text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Besoin Corrigé</p>
            <p className="text-xl font-black text-slate-900">{liveSpecs.neededKWp.toFixed(2)} <span className="text-sm font-bold text-slate-400">kWc</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
            <i className="fa-solid fa-bolt text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consommation Étudiée</p>
            <p className="text-xl font-black text-slate-900">{liveTotals.totalDailyKWh.toFixed(2)} <span className="text-sm font-bold text-slate-400">kWh/j</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <i className="fa-solid fa-gauge-high text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pic de Puissance</p>
            <p className="text-xl font-black text-slate-900">{liveTotals.totalMaxW} <span className="text-sm font-bold text-slate-400">W</span></p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-blue-500">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-gears text-white text-xs"></i>
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest">Paramètres de Calcul</h4>
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-tight">Efficacité du système solaire</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rendement (%)</label>
            <div className="relative">
              <input 
                type="number" min="0" max="100"
                value={config.efficiencyPercent}
                onChange={(e) => setConfig({...config, efficiencyPercent: Math.max(0, parseInt(e.target.value) || 0)})}
                className="w-20 bg-slate-800 border border-slate-700 rounded-lg p-2 text-center font-black text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-2 top-2 text-[9px] font-bold text-slate-500">%</span>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-slate-700 hidden md:block"></div>

          <div className="flex items-center gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Panneau (W)</label>
            <div className="relative">
              <input 
                type="number" min="1"
                value={config.panelPowerW}
                onChange={(e) => setConfig({...config, panelPowerW: Math.max(1, parseInt(e.target.value) || 0)})}
                className="w-24 bg-slate-800 border border-slate-700 rounded-lg p-2 text-center font-black text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-2 top-2 text-[9px] font-bold text-slate-500">W</span>
            </div>
          </div>
          <button 
            onClick={handleCalculatePanels}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg"
          >
            Calculer Nb. Panneaux
          </button>
          
          {panelCountResult !== null && (
            <div className="bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center gap-3 shadow-xl border border-blue-400/30 animate-in fade-in zoom-in duration-300">
              <span className="text-lg font-black">{panelCountResult} panneaux</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
              <i className="fa-solid fa-boxes-stacked text-blue-500"></i> Articles du Devis
            </h3>
            <button onClick={addItem} className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-black px-4 py-2 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wider">
              <i className="fa-solid fa-plus"></i> Ajouter un article
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[1100px] space-y-3">
              <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-slate-50 rounded-lg text-[10px] uppercase font-black text-slate-400 tracking-widest items-center">
                <div className="col-span-2">Désignation</div>
                <div className="col-span-2 text-center">Conso Horaire (kWh)</div>
                <div className="col-span-1 text-center">Puissance (W)</div>
                <div className="col-span-1 text-center">Durée (h/j)</div>
                <div className="col-span-1 text-center">Qté</div>
                <div className="col-span-1 text-center">Crête ?</div>
                <div className="col-span-2 text-right">P.U. HT ($)</div>
                <div className="col-span-1 text-right">Total HT</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>

              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center px-2 py-1 border-b border-slate-50 last:border-0 group transition-colors hover:bg-slate-50/50">
                  <div className="col-span-2">
                    <input 
                      type="text" value={item.appareil} 
                      onChange={(e) => updateItem(item.id, 'appareil', e.target.value)}
                      className="w-full bg-white border border-transparent hover:border-slate-100 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <input 
                        type="number" step="0.001" min="0" value={item.puissanceHoraireKWh} 
                        onChange={(e) => updateItem(item.id, 'puissanceHoraireKWh', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border-none rounded-lg text-sm p-2.5 text-center font-bold text-blue-600"
                      />
                      <span className="absolute right-2 top-2.5 text-[9px] text-slate-400">kWh</span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="relative">
                      <input 
                        type="number" min="0" value={item.puissanceMaxW} 
                        onChange={(e) => updateItem(item.id, 'puissanceMaxW', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border-none rounded-lg text-sm p-2.5 text-center font-bold"
                      />
                      <span className="absolute right-1 top-2.5 text-[9px] text-slate-400">W</span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <input 
                      type="number" step="0.5" min="0" value={item.dureeHj} 
                      onChange={(e) => updateItem(item.id, 'dureeHj', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border-none rounded-lg text-sm p-2.5 text-center font-medium text-slate-600"
                    />
                  </div>
                  <div className="col-span-1">
                    <input 
                      type="number" min="0" value={item.quantite} 
                      onChange={(e) => updateItem(item.id, 'quantite', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border-none rounded-lg text-sm p-2.5 text-center font-black"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <input 
                      type="checkbox" 
                      checked={item.inclusPuisCrete} 
                      onChange={(e) => updateItem(item.id, 'inclusPuisCrete', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <input 
                        type="number" min="0" value={item.unitPrice} 
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border-none rounded-lg text-sm p-2.5 text-right font-bold pr-6"
                      />
                      <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">$</span>
                    </div>
                  </div>
                  <div className="col-span-1 text-sm font-black text-slate-900 text-right pr-2">
                    {((item.unitPrice || 0) * item.quantite).toLocaleString(undefined, { minimumFractionDigits: 2 })} $
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button 
                      onClick={() => removeItem(item.id)} 
                      title="Supprimer la ligne"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <h3 className="font-black mb-10 flex items-center gap-2 uppercase text-[10px] tracking-[0.3em] text-blue-400">
               Stratégie Commerciale
            </h3>
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Marge Matériel (%)</label>
                  <div className="relative">
                    <input 
                      type="number" min="0" value={config.marginPercent} 
                      onChange={(e) => setConfig({...config, marginPercent: Math.max(0, parseFloat(e.target.value) || 0)})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                    />
                    <span className="absolute right-4 top-4 text-slate-500 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Remise Client (%)</label>
                  <div className="relative">
                    <input 
                      type="number" min="0" max="100" value={config.discountPercent} 
                      onChange={(e) => setConfig({...config, discountPercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                    />
                    <span className="absolute right-4 top-4 text-slate-500 font-bold">%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Installation ($ HT)</label>
                <div className="relative">
                  <input 
                    type="number" min="0" value={config.installCost} 
                    onChange={(e) => setConfig({...config, installCost: Math.max(0, parseFloat(e.target.value) || 0)})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                  />
                  <span className="absolute right-4 top-4 text-slate-500 font-bold">$</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-black text-slate-900 mb-10 uppercase text-[10px] tracking-[0.3em] border-b border-slate-100 pb-4">
                <i className="fa-solid fa-landmark text-slate-400 mr-2"></i> Fiscalité & Taxes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">TVA Matériel (%)</label>
                  <div className="relative">
                    <input 
                      type="number" min="0"
                      step="0.1"
                      value={config.materialTaxPercent}
                      onChange={(e) => setConfig({...config, materialTaxPercent: Math.max(0, parseFloat(e.target.value) || 0)})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-base font-black text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                    />
                    <span className="absolute right-5 top-4.5 text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">TVA Installation (%)</label>
                  <div className="relative">
                    <input 
                      type="number" min="0"
                      step="0.1"
                      value={config.installTaxPercent}
                      onChange={(e) => setConfig({...config, installTaxPercent: Math.max(0, parseFloat(e.target.value) || 0)})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-base font-black text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                    />
                    <span className="absolute right-5 top-4.5 text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 bg-blue-50 rounded-2xl flex gap-4 items-start">
               <i className="fa-solid fa-circle-info text-blue-500 mt-1"></i>
               <div className="text-[11px] text-blue-700 leading-relaxed font-medium">
                  Les taxes sont calculées sur la base des montants nets. 
                  En Haïti, la TCA est généralement le standard de taxation.
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
