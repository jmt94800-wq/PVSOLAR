
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  notes: string;
  createdAt: number;
  updatedAt: number; // Pour le tracking de synchro
  agentId: string;    // Qui a créé le client
}

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
  agentName: string; // Nom de l'agent qui a fait la visite
}

export interface AppDB {
  clients: Client[];
  addresses: Address[];
  devices: Device[];
  visits: Visit[];
}
