
import { useEffect, useState } from 'react';
import { ClientProfile, QuoteConfig } from '../types';
import { calculateSolarSpecs } from '../utils';
import { getEnergyAnalysis } from '../geminiService';

interface QuoteGeneratorProps {
  profile: ClientProfile;
  config: QuoteConfig;
  onBack: () => void;
}

export const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({ profile, config, onBack }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const specs = calculateSolarSpecs(profile.totalDailyKWh, config.panelPowerW, config.efficiencyPercent);

  // Calculs financiers précis
  const materialMarginMultiplier = 1 + (config.marginPercent / 100);
  const visibleItems = profile.items.filter(item => item.quantite > 0 && (item.unitPrice || 0) > 0);
  
  const totalMaterialHT_Base = Math.round(visibleItems.reduce((sum, i) => sum + ((i.unitPrice || 0) * i.quantite * materialMarginMultiplier), 0) * 100) / 100;
  const discountAmount = Math.round(totalMaterialHT_Base * (config.discountPercent / 100) * 100) / 100;
  const totalMaterialAfterDiscount = totalMaterialHT_Base - discountAmount;
  const materialTax = Math.round(totalMaterialAfterDiscount * (config.materialTaxPercent / 100) * 100) / 100;
  
  const installTax = Math.round(config.installCost * (config.installTaxPercent / 100) * 100) / 100;
  const grandTotal = totalMaterialAfterDiscount + materialTax + config.installCost + installTax;

  // Calcul des arrhes
  const depositPercent = grandTotal > 1000 ? 30 : 50;
  const depositAmount = grandTotal * (depositPercent / 100);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      
      const financials = {
        totalMaterialHT: totalMaterialHT_Base,
        totalMaterialTTC: totalMaterialAfterDiscount + materialTax,
        installHT: config.installCost,
        installTTC: config.installCost + installTax,
        grandTotal: grandTotal,
        discountAmount: discountAmount
      };

      // On s'assure que le profil envoyé à l'IA contient bien les items filtrés pour éviter toute confusion
      const filteredProfile = {
        ...profile,
        items: visibleItems
      };

      const res = await getEnergyAnalysis(filteredProfile, config, financials);
      setAnalysis(res || '');
      setLoading(false);
    };
    fetchAnalysis();
  }, [profile, config, grandTotal]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-2 px-2 print:py-0 print:px-0">
      <div className="no-print mb-2 flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-wider"
        >
          <i className="fa-solid fa-chevron-left"></i> Retour
        </button>
        <button 
          onClick={handlePrint}
          className="bg-slate-900 text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-print"></i> Imprimer
        </button>
      </div>

      <div className="bg-white shadow-xl overflow-hidden border border-slate-100 quote-container print:shadow-none print:border-none" id="printable-quote">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center print:p-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-blue-600 p-1 rounded-lg no-print">
                <i className="fa-solid fa-sun text-white text-[10px]"></i>
              </div>
              <h1 className="text-lg font-black text-slate-900">SolarDevis <span className="text-blue-600">Pro</span></h1>
            </div>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Expertise Solaire Haïti • Audit certifié</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black text-slate-800 mb-0">DEVIS</h2>
            <p className="text-slate-400 text-[8px] uppercase tracking-widest font-black">Réf: {Math.floor(Math.random() * 100000).toString().padStart(6, '0')} • {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-4 print:p-2">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-[8px] font-black uppercase tracking-widest text-blue-600 mb-1">Client</h3>
              <p className="text-sm font-black text-slate-800 leading-tight">{profile.name}</p>
              <p className="text-slate-600 text-[10px] leading-tight">{profile.address}</p>
              <p className="text-slate-500 text-[9px]">{profile.siteName}</p>
            </div>
            <div className="text-right">
              <h3 className="text-[8px] font-black uppercase tracking-widest text-blue-600 mb-1">Émetteur</h3>
              <p className="text-xs font-bold text-slate-800">{profile.agentName || 'Expert Solaire Certifié'}</p>
              <p className="text-slate-400 text-[8px] mt-0.5 uppercase font-medium">HSP: 5.2 | Rendement: {config.efficiencyPercent}%</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Besoin Corrigé</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-blue-600">{specs.neededKWp.toFixed(2)}</span>
                  <span className="text-[10px] font-bold text-slate-600">kWc</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-slate-800">{specs.panelCount}</span>
                <p className="text-[7px] text-slate-400 uppercase">Panneaux</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Consommation</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-orange-600">{profile.totalDailyKWh.toFixed(2)}</span>
                  <span className="text-[10px] font-bold text-slate-600">kWh/j</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-slate-800">{profile.totalMaxW}W</span>
                <p className="text-[7px] text-slate-400 uppercase">Pic Max</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mb-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="py-1 text-[8px] uppercase font-black text-slate-900">Désignation</th>
                  <th className="py-1 text-center text-[8px] uppercase font-black text-slate-900">Puissance</th>
                  <th className="py-1 text-center text-[8px] uppercase font-black text-slate-900">Qté</th>
                  <th className="py-1 text-right text-[8px] uppercase font-black text-slate-900">P.U. ($ HT)</th>
                  <th className="py-1 text-right text-[8px] uppercase font-black text-slate-900">Total ($ HT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {visibleItems.map((item, i) => {
                  const displayUnitPrice = Math.round((item.unitPrice || 0) * materialMarginMultiplier * 100) / 100;
                  return (
                    <tr key={i}>
                      <td className="py-1.5">
                        <div className="font-bold text-slate-800 leading-tight">{item.appareil}</div>
                        {!item.inclusPuisCrete && <span className="text-[6px] font-black uppercase text-slate-400 tracking-tighter">Hors-dim</span>}
                      </td>
                      <td className="py-1.5 text-center text-slate-500">{item.puissanceMaxW > 0 ? `${item.puissanceMaxW}W` : '-'}</td>
                      <td className="py-1.5 text-center font-bold">{item.quantite}</td>
                      <td className="py-1.5 text-right font-medium">{displayUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} $</td>
                      <td className="py-1.5 text-right font-black">{(displayUnitPrice * item.quantite).toLocaleString(undefined, { minimumFractionDigits: 2 })} $</td>
                    </tr>
                  )
                })}
                {config.installCost > 0 && (
                  <tr className="bg-slate-50/50">
                    <td className="py-1.5 font-bold italic">Installation & Main d'œuvre</td>
                    <td className="py-1.5 text-center">-</td>
                    <td className="py-1.5 text-center">1</td>
                    <td className="py-1.5 text-right font-medium">{config.installCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} $</td>
                    <td className="py-1.5 text-right font-black">{config.installCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} $</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-4">
            <div className="w-full max-w-[240px] space-y-1">
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>Sous-total HT</span>
                <span>{(totalMaterialHT_Base + config.installCost).toLocaleString(undefined, { minimumFractionDigits: 2 })} $</span>
              </div>
              {config.discountPercent > 0 && (
                <div className="flex justify-between text-blue-700 font-bold text-[10px]">
                  <span>Remise Matériel ({config.discountPercent}%)</span>
                  <span>- {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} $</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 text-[9px] pt-0.5">
                <span>Total Taxes</span>
                <span>{(materialTax + installTax).toLocaleString(undefined, { minimumFractionDigits: 2 })} $</span>
              </div>
              <div className="pt-1 border-t border-slate-900 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Net à payer</span>
                <span className="text-sm font-black text-blue-600">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} $</span>
              </div>
            </div>
          </div>

          {/* Signature & Conditions */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-2 border-t border-slate-100 print:mt-2">
            <div className="text-slate-400 text-[7px] italic leading-tight flex flex-col gap-1">
              <p>Proposition valable 30 jours. La TCA est appliquée selon la réglementation haïtienne.</p>
              <p className="text-slate-600 font-bold">Conditions de paiement : Acompte (arrhes) de {depositPercent}% soit {depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} $ dû à la signature pour validation de commande.</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-[7px] font-black text-slate-900 uppercase mb-4 tracking-widest">Bon pour accord (Date et Signature)</div>
              <div className="w-full max-w-[150px] h-10 border border-dashed border-slate-200 rounded flex items-center justify-center text-[7px] text-slate-300 font-black">SIGNATURE</div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="mt-4 no-print border-t border-slate-100 pt-4 print:mt-2 print:border-none">
            <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-blue-500 text-xs"></i> Audit Technique & Financier (IA)
            </h3>
            {loading ? (
              <div className="text-[9px] text-slate-400 animate-pulse font-bold">Vérification des calculs et de la cohérence technique...</div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-3 text-slate-700 leading-tight text-[10px] print:p-0 print:bg-white print:text-[8px]">
                <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>') }} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 p-4 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
             <i className="fa-solid fa-solar-panel text-blue-400 text-xs"></i>
             <p className="text-white text-[8px] font-black uppercase tracking-widest italic">SolarDevis Pro Haiti</p>
          </div>
          <button 
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-black text-[10px] transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-file-pdf"></i> Imprimer Devis
          </button>
        </div>
      </div>
    </div>
  );
};
