
import { Visit, Client, Address, Device, ExportRow, QuoteData, QuoteItem } from './types';

/**
 * Transforme les données de visites en lignes d'export à plat
 */
export const flattenVisitData = (
  visits: Visit[],
  clients: Client[],
  addresses: Address[],
  catalogue: Device[]
): ExportRow[] => {
  const rows: ExportRow[] = [];

  visits.forEach(visit => {
    const client = clients.find(c => c.id === visit.clientId);
    const address = addresses.find(a => a.id === visit.addressId);
    
    let totalHourlyKWh = 0;
    let totalMaxW = 0;

    visit.requirements.forEach(req => {
      const device = catalogue.find(d => d.id === req.deviceId);
      if (device) {
        const hKwh = req.overrideHourlyPower ?? device.hourlyPower;
        const pMax = req.overrideMaxPower ?? device.maxPower;
        
        totalHourlyKWh += hKwh * req.quantity;
        totalMaxW += pMax * req.quantity;

        rows.push({
          client: client?.name || 'Inconnu',
          lieu: address?.label || 'N/A',
          adresse: address ? `${address.street}, ${address.zip} ${address.city}` : 'N/A',
          date: new Date(visit.date).toLocaleDateString(),
          agent: visit.agentName || 'Inconnu',
          appareil: req.overrideName || device.name,
          puissanceHoraireKWh: hKwh,
          puissanceMaxW: pMax,
          dureeHj: req.overrideUsageDuration ?? device.usageDuration,
          quantite: req.quantity,
          inclusPuissance: req.includedInPeakPower !== false
        });
      }
    });

    // Ajout de la ligne Batterie si autonomie > 0
    if (visit.autonomyDays && visit.autonomyDays > 0) {
      rows.push({
        client: client?.name || 'Inconnu',
        lieu: address?.label || 'N/A',
        adresse: address ? `${address.street}, ${address.zip} ${address.city}` : 'N/A',
        date: new Date(visit.date).toLocaleDateString(),
        agent: visit.agentName || 'Inconnu',
        appareil: 'Batterie',
        puissanceHoraireKWh: totalHourlyKWh, // Somme des puissances horaires
        puissanceMaxW: totalMaxW,           // Somme des puissances maximum
        dureeHj: 0,
        quantite: 1,
        inclusPuissance: false
      });
    }
  });

  return rows;
};

/**
 * Prépare les données pour le générateur de devis ou le dashboard
 */
export const prepareQuoteData = (
  visit: Visit,
  client: Client,
  address: Address | undefined,
  catalogue: Device[]
): QuoteData => {
  const items: QuoteItem[] = (visit.requirements || []).map(req => {
    const device = catalogue.find(d => d.id === req.deviceId);
    const powerW = req.overrideMaxPower ?? device?.maxPower ?? 0;
    const durationH = req.overrideUsageDuration ?? device?.usageDuration ?? 0;
    const hourlyKWh = req.overrideHourlyPower ?? device?.hourlyPower ?? 0;
    
    return {
      name: req.overrideName || device?.name || 'Appareil inconnu',
      quantity: req.quantity,
      powerW,
      durationH,
      dailyKWh: hourlyKWh * durationH * req.quantity,
      includedInPeakPower: req.includedInPeakPower !== false
    };
  });

  // Logique batterie pour le devis également
  if (visit.autonomyDays && visit.autonomyDays > 0) {
    const totalHKwh = items.reduce((sum, item) => sum + (item.dailyKWh / (item.durationH || 1)), 0);
    const totalMaxWCalc = items.reduce((sum, item) => sum + (item.powerW * item.quantity), 0);
    
    items.push({
      name: `Batterie (Autonomie: ${visit.autonomyDays}j)`,
      quantity: 1,
      powerW: totalMaxWCalc,
      durationH: 0,
      dailyKWh: 0,
      includedInPeakPower: false
    });
  }

  const totalDailyKWh = items.reduce((sum, item) => sum + item.dailyKWh, 0);
  const totalMaxW = items.reduce((sum, item) => sum + (item.includedInPeakPower ? (item.powerW * item.quantity) : 0), 0);

  return {
    name: client.name || 'Client sans nom',
    address: address ? `${address.street}, ${address.zip} ${address.city}` : 'Adresse non renseignée',
    siteName: address?.label || 'Site par défaut',
    visitDate: visit.date ? new Date(visit.date).toLocaleDateString('fr-FR') : 'Date inconnue',
    items,
    totalDailyKWh,
    totalMaxW
  };
};
