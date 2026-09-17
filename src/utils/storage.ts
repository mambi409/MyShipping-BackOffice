import { ShipmentRecord, AuthSession, SenderRecord, CarrierRecord, BulkBoxRecord, RouteRecord } from '../types';
import { INITIAL_SHIPMENTS } from '../data/mockShipments';
import { INITIAL_SENDERS } from '../data/mockSenders';
import { DEFAULT_CARRIERS } from '../data/mockCarriers';
import { DEFAULT_BULK_BOXES } from '../data/mockBulkBoxes';
import { DEFAULT_ROUTES } from '../data/mockRoutes';

const SHIPMENTS_STORAGE_KEY = 'shipment_portal_records_v1';
const SENDERS_STORAGE_KEY = 'shipment_portal_senders_v1';
const CARRIERS_STORAGE_KEY = 'shipment_portal_carriers_v1';
const BULK_BOXES_STORAGE_KEY = 'shipment_portal_bulk_boxes_v1';
const ROUTES_STORAGE_KEY = 'shipment_portal_routes_v1';
const AUTH_STORAGE_KEY = 'shipment_portal_auth_v1';

export function getStoredRoutes(): RouteRecord[] {
  try {
    const raw = localStorage.getItem(ROUTES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(DEFAULT_ROUTES));
      return DEFAULT_ROUTES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_ROUTES;
  } catch (error) {
    console.error('Failed to read routes from localStorage:', error);
    return DEFAULT_ROUTES;
  }
}

export function saveRoute(route: RouteRecord): RouteRecord[] {
  const current = getStoredRoutes();
  const existingIndex = current.findIndex((r) => r.id === route.id);
  let updated: RouteRecord[];
  if (existingIndex >= 0) {
    updated = current.map((r) => (r.id === route.id ? route : r));
  } else {
    updated = [route, ...current];
  }
  try {
    localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to persist route record:', error);
  }
  return updated;
}

export function deleteRoute(id: string): RouteRecord[] {
  const current = getStoredRoutes();
  const updated = current.filter((r) => r.id !== id);
  try {
    localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete route record:', error);
  }
  return updated;
}

export function resetRoutes(): RouteRecord[] {
  try {
    localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(DEFAULT_ROUTES));
  } catch (error) {
    console.error('Failed to reset routes:', error);
  }
  return DEFAULT_ROUTES;
}

export function getStoredBulkBoxes(): BulkBoxRecord[] {
  try {
    const raw = localStorage.getItem(BULK_BOXES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BULK_BOXES_STORAGE_KEY, JSON.stringify(DEFAULT_BULK_BOXES));
      return DEFAULT_BULK_BOXES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all bulk boxes have an attached routeRemarks and no legacy notes
      let hasMigration = false;
      const migrated = parsed.map((box: BulkBoxRecord & { notes?: string }, idx: number) => {
        let updatedBox = { ...box };
        if ('notes' in updatedBox) {
          delete (updatedBox as { notes?: string }).notes;
          hasMigration = true;
        }
        if (!updatedBox.routeRemarks) {
          hasMigration = true;
          const matched = DEFAULT_BULK_BOXES.find(
            (d) => d.boxId.toUpperCase() === updatedBox.boxId.toUpperCase()
          );
          updatedBox.routeRemarks = matched?.routeRemarks || (idx % 2 === 0 ? 'Copa Airline' : 'American Airline');
        }
        return updatedBox as BulkBoxRecord;
      });
      if (hasMigration) {
        try {
          localStorage.setItem(BULK_BOXES_STORAGE_KEY, JSON.stringify(migrated));
        } catch {
          // ignore
        }
      }
      return migrated;
    }
    return DEFAULT_BULK_BOXES;
  } catch (error) {
    console.error('Failed to read bulk boxes from localStorage:', error);
    return DEFAULT_BULK_BOXES;
  }
}

export function saveBulkBox(box: BulkBoxRecord): BulkBoxRecord[] {
  const current = getStoredBulkBoxes();
  const existingIndex = current.findIndex((b) => b.id === box.id || b.boxId.toUpperCase() === box.boxId.toUpperCase());
  let updated: BulkBoxRecord[];
  if (existingIndex >= 0) {
    updated = current.map((b, idx) => (idx === existingIndex ? { ...b, ...box } : b));
  } else {
    updated = [box, ...current];
  }
  try {
    localStorage.setItem(BULK_BOXES_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to persist bulk box record:', error);
  }
  return updated;
}

export function deleteBulkBox(id: string): BulkBoxRecord[] {
  const current = getStoredBulkBoxes();
  const updated = current.filter((b) => b.id !== id);
  try {
    localStorage.setItem(BULK_BOXES_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete bulk box record:', error);
  }
  return updated;
}

export function resetBulkBoxes(): BulkBoxRecord[] {
  try {
    localStorage.setItem(BULK_BOXES_STORAGE_KEY, JSON.stringify(DEFAULT_BULK_BOXES));
  } catch (error) {
    console.error('Failed to reset bulk boxes:', error);
  }
  return DEFAULT_BULK_BOXES;
}

export function getStoredCarriers(): CarrierRecord[] {
  try {
    const raw = localStorage.getItem(CARRIERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CARRIERS_STORAGE_KEY, JSON.stringify(DEFAULT_CARRIERS));
      return DEFAULT_CARRIERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_CARRIERS;
  } catch (error) {
    console.error('Failed to read carriers from localStorage:', error);
    return DEFAULT_CARRIERS;
  }
}

export function saveCarrier(carrier: CarrierRecord): CarrierRecord[] {
  const current = getStoredCarriers();
  const existingIndex = current.findIndex((c) => c.id === carrier.id);
  let updated: CarrierRecord[];
  if (existingIndex >= 0) {
    updated = current.map((c) => (c.id === carrier.id ? carrier : c));
  } else {
    updated = [carrier, ...current];
  }
  try {
    localStorage.setItem(CARRIERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to persist carrier record:', error);
  }
  return updated;
}

export function deleteCarrier(id: string): CarrierRecord[] {
  const current = getStoredCarriers();
  const updated = current.filter((c) => c.id !== id);
  try {
    localStorage.setItem(CARRIERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete carrier record:', error);
  }
  return updated;
}

export function resetCarriers(): CarrierRecord[] {
  try {
    localStorage.setItem(CARRIERS_STORAGE_KEY, JSON.stringify(DEFAULT_CARRIERS));
  } catch (error) {
    console.error('Failed to reset carriers:', error);
  }
  return DEFAULT_CARRIERS;
}

export function getStoredSenders(): SenderRecord[] {
  try {
    const raw = localStorage.getItem(SENDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SENDERS_STORAGE_KEY, JSON.stringify(INITIAL_SENDERS));
      return INITIAL_SENDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SENDERS;
  } catch (error) {
    console.error('Failed to read senders from localStorage:', error);
    return INITIAL_SENDERS;
  }
}

export function saveSender(sender: SenderRecord): SenderRecord[] {
  const current = getStoredSenders();
  const existingIndex = current.findIndex((s) => s.id === sender.id);
  let updated: SenderRecord[];
  if (existingIndex >= 0) {
    updated = current.map((s) => (s.id === sender.id ? sender : s));
  } else {
    updated = [sender, ...current];
  }
  try {
    localStorage.setItem(SENDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to persist sender record:', error);
  }
  return updated;
}

export function deleteSender(id: string): SenderRecord[] {
  const current = getStoredSenders();
  const updated = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(SENDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete sender record:', error);
  }
  return updated;
}

export function resetSenders(): SenderRecord[] {
  try {
    localStorage.setItem(SENDERS_STORAGE_KEY, JSON.stringify(INITIAL_SENDERS));
  } catch (error) {
    console.error('Failed to reset senders:', error);
  }
  return INITIAL_SENDERS;
}

export function getStoredShipments(): ShipmentRecord[] {
  try {
    const raw = localStorage.getItem(SHIPMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(INITIAL_SHIPMENTS));
      return INITIAL_SHIPMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SHIPMENTS;
  } catch (error) {
    console.error('Failed to read shipments from localStorage:', error);
    return INITIAL_SHIPMENTS;
  }
}

export function saveShipment(shipment: ShipmentRecord): ShipmentRecord[] {
  const current = getStoredShipments();
  const existingIdx = current.findIndex((s) => s.id === shipment.id);
  let updated: ShipmentRecord[];
  if (existingIdx >= 0) {
    updated = current.map((s) => (s.id === shipment.id ? shipment : s));
  } else {
    updated = [shipment, ...current];
  }
  try {
    localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to persist shipment record:', error);
  }
  return updated;
}

export function deleteShipment(id: string): ShipmentRecord[] {
  const current = getStoredShipments();
  const updated = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete shipment record:', error);
  }
  return updated;
}

export function resetShipments(): ShipmentRecord[] {
  try {
    localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(INITIAL_SHIPMENTS));
  } catch (error) {
    console.error('Failed to reset shipments:', error);
  }
  return INITIAL_SHIPMENTS;
}

export function getStoredAuth(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveStoredAuth(session: AuthSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
  } catch (error) {
    console.error('Failed to save auth session:', error);
  }
}

export function exportShipmentsToCSV(shipments: ShipmentRecord[]): void {
  if (shipments.length === 0) return;

  const headers = [
    'Tracking Number',
    'Bulk Box ID',
    'e-Shipping Date',
    'Sender Name',
    'Email Address',
    'User ID',
    'User Tax ID',
    'Date',
    'Shipper',
    'Route / Remarks',
    'Length',
    'Width',
    'Height',
    'Dimension Unit',
    'Weight',
    'Weight Unit',
    'Volume',
    'Status',
    'Notes',
  ];

  const escapeCsv = (str: string | number | undefined) => {
    if (str === undefined || str === null) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = shipments.map((s) => {
    const volume = (s.length * s.width * s.height).toFixed(1);
    return [
      escapeCsv(s.trackingNumber),
      escapeCsv(s.boxId),
      escapeCsv(s.eShippingDate || ''),
      escapeCsv(s.name),
      escapeCsv(s.email),
      escapeCsv(s.userId),
      escapeCsv(s.userTaxId),
      escapeCsv(s.currentDate),
      escapeCsv(s.shipper),
      escapeCsv(s.routeRemarks || ''),
      escapeCsv(s.length),
      escapeCsv(s.width),
      escapeCsv(s.height),
      escapeCsv(s.dimensionUnit),
      escapeCsv(s.weight),
      escapeCsv(s.weightUnit),
      escapeCsv(`${volume} ${s.dimensionUnit}³`),
      escapeCsv(s.status),
      escapeCsv(s.notes || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `shipment_manifest_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
