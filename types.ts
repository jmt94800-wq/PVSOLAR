
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  notes: string; // Commentaire global sur le client
  createdAt: number;
}

export interface Address {
  id: string;
  clientId: string;
  label: string; // e.g., "Maison", "Bureaux"
  street: string;
  city: string;
  zip: string;
}

export interface Device {
  id: string;
  name: string;
  maxPower: number; // Watts
  usageDuration: number; // Hours per day
  hourlyPower: number; // Consumption per hour (kWh equivalent)
}

export interface VisitRequirement {
  deviceId: string;
  quantity: number;
}

export interface Visit {
  id: string;
  clientId: string;
  addressId: string;
  date: string; // ISO format
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  requirements: VisitRequirement[];
  photos: string[]; // Base64 strings
  notes: string; // Notes rapides / observations
  report: string; // Rapport formel de visite
}

export interface AppDB {
  clients: Client[];
  addresses: Address[];
  devices: Device[];
  visits: Visit[];
}
