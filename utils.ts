
import { ProspectEntry, ClientProfile } from './types';

export const parseCSV = (csvText: string): ProspectEntry[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  
  return lines.slice(1).map((line, idx) => {
    const values = line.split(delimiter).map(v => v.replace(/^"|"$/g, '').trim());
    const parseFrFloat = (val: string) => {
      if (!val) return 0;
      return parseFloat(val.replace(',', '.').replace(/[^0-9.-]/g, '')) || 0;
    };

    return {
      id: `csv-${idx}-${Date.now()}`,
      client: values[0] || '',
      lieu: values[1] || '',
      adresse: values[2] || '',
      date: values[3] || '',
      agent: values[4] || '',
      appareil: values[5] || '',
      inclusPuisCrete: values[6] ? values[6].toUpperCase() === 'OUI' : true,
      puissanceHoraireKWh: Math.max(0, parseFrFloat(values[7])),
      puissanceMaxW: Math.max(0, parseFrFloat(values[8])),
      dureeHj: Math.max(0, parseFrFloat(values[9])),
      quantite: Math.max(0, parseInt(values[10], 10) || 0),
      unitPrice: 0,
      observations: values[11] || '',
      agentName: values[12] || values[4] || '' // Fallback sur la colonne agent si colonne 12 vide
    };
  });
};

export const calculateTotals = (items: ProspectEntry[]) => {
  const dailyKWh = items.reduce((sum, i) => sum + (i.inclusPuisCrete && i.quantite > 0 ? i.puissanceHoraireKWh * i.dureeHj * i.quantite : 0), 0);
  const maxW = items.reduce((sum, i) => sum + (i.inclusPuisCrete && i.quantite > 0 ? i.puissanceMaxW * i.quantite : 0), 0);
  return { totalDailyKWh: dailyKWh, totalMaxW: maxW };
};

export const groupByClient = (entries: ProspectEntry[]): ClientProfile[] => {
  const groups: Record<string, ProspectEntry[]> = {};
  
  entries.forEach(entry => {
    const key = `${entry.client}-${entry.adresse}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  });

  return Object.values(groups).map(items => {
    const first = items[0];
    const totals = calculateTotals(items);
    return {
      name: first.client,
      address: first.adresse,
      siteName: first.lieu,
      visitDate: first.date,
      items,
      observations: first.observations || '',
      agentName: first.agentName || first.agent || '',
      ...totals
    };
  });
};

export const calculateSolarSpecs = (dailyKWh: number, panelPowerW: number = 425, efficiencyPercent: number = 80) => {
  const hsp = 5.2; 
  const basicKWp = dailyKWh / hsp; 
  const efficiencyFactor = Math.max(0.1, efficiencyPercent / 100);
  const neededKWp = basicKWp / efficiencyFactor;
  
  const panelCount = Math.ceil((neededKWp * 1000) / Math.max(1, panelPowerW));
  return {
    neededKWp: parseFloat(neededKWp.toFixed(2)),
    panelCount
  };
};
