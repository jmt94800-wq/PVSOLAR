
import React, { useState } from 'react';
import { ClientProfile } from '../types';

interface DashboardProps {
  profiles: ClientProfile[];
  savedProfiles: ClientProfile[];
  onSelect: (p: ClientProfile) => void;
  onDeleteSaved: (name: string, address: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profiles, savedProfiles, onSelect, onDeleteSaved }) => {
  const [activeTab, setActiveTab] = useState<'imports' | 'saved'>(profiles.length > 0 ? 'imports' : 'saved');

  const renderProfileCard = (profile: ClientProfile, isSaved: boolean) => (
    <div 
      key={`${profile.name}-${profile.address}`}
      onClick={() => onSelect(profile)}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
    >
      {isSaved && (
        <div className="absolute top-0 right-0">
          <div className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 uppercase tracking-widest rounded-bl-lg">
            Enregistré
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="pr-8">
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
            {profile.name}
          </h3>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
            <i className="fa-solid fa-location-dot text-blue-400"></i> {profile.siteName}
          </p>
        </div>
        {!isSaved && (
          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
            {profile.items.length} lignes
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Conso Journalière</span>
          <span className="font-bold text-slate-700">{profile.totalDailyKWh.toFixed(2)} kWh</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Puissance Max</span>
          <span className="font-black text-orange-600">{profile.totalMaxW} W</span>
        </div>
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
            {isSaved ? `Modifié le ${new Date(profile.savedAt!).toLocaleDateString()}` : `Visite le ${profile.visitDate}`}
          </span>
          <div className="flex items-center gap-2">
            {isSaved && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteSaved(profile.name, profile.address); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            )}
            <span className="text-blue-600 text-sm font-black group-hover:translate-x-1 transition-transform">
              {isSaved ? 'Reprendre' : 'Configurer'} <i className="fa-solid fa-arrow-right ml-1"></i>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-slate-200 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('imports')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'imports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-file-import mr-2"></i> Imports ({profiles.length})
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-bookmark mr-2"></i> Enregistrés ({savedProfiles.length})
        </button>
      </div>

      {activeTab === 'imports' && (
        profiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {profiles.map(p => renderProfileCard(p, false))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
             <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-200 mb-4"></i>
             <p className="text-slate-400 font-bold">Aucun import CSV actif. Veuillez importer un fichier.</p>
          </div>
        )
      )}

      {activeTab === 'saved' && (
        savedProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {savedProfiles.map(p => renderProfileCard(p, true))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
             <i className="fa-solid fa-box-open text-4xl text-slate-200 mb-4"></i>
             <p className="text-slate-400 font-bold">Aucun devis enregistré pour le moment.</p>
          </div>
        )
      )}
    </div>
  );
};
