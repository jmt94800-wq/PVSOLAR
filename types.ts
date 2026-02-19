
export interface ProspectEntry {
  id: string;
  client: string;
  lieu: string;
  adresse: string;
  date: string;
  agent: string;
  appareil: string;
  puissanceHoraireKWh: number;
  puissanceMaxW: number;
  dureeHj: number;
  quantite: number;
  inclusPuisCrete: boolean;
  unitPrice?: number;
  observations?: string;
  agentName?: string;
}

export interface ClientProfile {
  name: string;
  address: string;
  siteName: string;
  visitDate: string;
  items: ProspectEntry[];
  totalDailyKWh: number;
  totalMaxW: number;
  observations: string;
  agentName: string;
  savedAt?: string;
  savedConfig?: QuoteConfig;
}

export interface QuoteConfig {
  marginPercent: number;
  discountPercent: number;
  materialTaxPercent: number;
  installCost: number;
  installTaxPercent: number;
  panelPowerW: number;
  efficiencyPercent: number;
}
