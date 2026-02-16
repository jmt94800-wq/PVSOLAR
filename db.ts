
import { Dexie, type Table } from 'dexie';
import { Client, Address, Device, Visit } from './types';

export class SolarVisitDB extends Dexie {
  clients!: Table<Client>;
  addresses!: Table<Address>;
  devices!: Table<Device>;
  visits!: Table<Visit>;

  constructor() {
    super('SolarVisitDB');
    // Define the database schema using the version() method from Dexie.
    // Using the named import { Dexie } ensures that TypeScript correctly identifies 
    // the base class and its inherited methods like .version() and .transaction().
    // Fix: Using named import for Dexie class to ensure inheritance is properly typed.
    this.version(1).stores({
      clients: 'id, name, email',
      addresses: 'id, clientId, label',
      devices: 'id, name',
      visits: 'id, clientId, addressId, date, status'
    });
  }
}

export const db = new SolarVisitDB();

// Default devices if empty
export const seedDevices = async () => {
  const count = await db.devices.count();
  if (count === 0) {
    await db.devices.bulkAdd([
      { id: '1', name: 'Pompe à Chaleur', maxPower: 3500, usageDuration: 8, hourlyPower: 2.5 },
      { id: '2', name: 'Ballon Thermo-dynamique', maxPower: 2000, usageDuration: 4, hourlyPower: 1.2 },
      { id: '3', name: 'Plaques Induction', maxPower: 7000, usageDuration: 1, hourlyPower: 3.0 },
      { id: '4', name: 'Borne de Recharge VE', maxPower: 7400, usageDuration: 6, hourlyPower: 7.4 },
    ]);
  }
};
