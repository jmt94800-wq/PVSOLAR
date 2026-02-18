
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
  agentId: string;
}

export type ClientProfile = Client;
export type ProspectEntry = Client;

export interface Address {
  id: string;
  clientId: string;
  label: string;
  street: string;
  city: string;
  zip: string;
  updatedAt: number;
}

export interface Device {
  id: string;
  name: string;
  maxPower: number;
  usageDuration: number;
  hourlyPower: number;
}

export interface VisitRequirement {
  deviceId: string;
  quantity: number;
  includedInPeakPower?: boolean; // Case à cocher : inclus ou non dans la puissance crête
  overrideName?: string;
  overrideMaxPower?: number;
  overrideUsageDuration?: number;
  overrideHourlyPower?: number;
}

export interface Visit {
  id: string;
  clientId: string;
  addressId: string;
  date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  requirements: VisitRequirement[];
  photos: string[];
  notes: string;
  report: string;
  updatedAt: number;
  agentName: string;
}

// --- Nouveaux types pour l'export et les devis ---

export interface ExportRow {
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
  inclusPuissance: boolean;
}

export interface QuoteItem {
  name: string;
  quantity: number;
  powerW: number;
  durationH: number;
  dailyKWh: number;
  includedInPeakPower: boolean;
}

export interface QuoteData {
  name: string;
  address: string;
  siteName: string;
  visitDate: string;
  items: QuoteItem[];
  totalDailyKWh: number;
  totalMaxW: number;
}

export interface AppDB {
  clients: Client[];
  addresses: Address[];
  devices: Device[];
  visits: Visit[];
}
