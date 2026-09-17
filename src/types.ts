export interface SenderRecord {
  id: string;
  name: string;
  email: string;
  userId: string;
  userTaxId: string;
  company?: string;
  phone?: string;
  notes?: string;
  createdAt: number;
}

export interface CarrierRecord {
  id: string;
  name: string;
  createdAt?: number;
}

export interface RouteRecord {
  id: string;
  name: string;
  createdAt?: number;
}

export interface BulkBoxRecord {
  id: string;
  boxId: string;
  shippingDate: string; // e-Shipping Date (YYYY-MM-DD)
  status?: 'Open' | 'Closed' | 'Shipped';
  routeRemarks?: string; // Associated transit route (e.g. Copa Airline, Sea Shipping)
  createdAt?: number;
  createdBy?: string;
}

export interface ShipmentRecord {
  id: string;
  name: string;
  email: string;
  trackingNumber: string;
  userId: string;
  userTaxId: string;
  currentDate: string; // ISO format or YYYY-MM-DD
  length: number;
  width: number;
  height: number;
  weight: number;
  dimensionUnit: 'cm' | 'in';
  weightUnit: 'kg' | 'lbs';
  shipper: string;
  boxId: string;
  eShippingDate?: string; // Electronic / Estimated Shipping Date for the Bulk Box
  routeRemarks?: string; // Selected Route / Remarks (e.g. Copa Airline, American Airline, Sea Shipping)
  createdAt: number;
  status: 'Received' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'On Hold';
  notes?: string;
  packageImage?: string; // Base64 data URL or image path for package photo/inspection
}

export interface AuthSession {
  isAuthenticated: boolean;
  username: string;
  role: 'Administrator' | 'Logistics Officer' | 'Staff';
  loginTime: string;
}

export interface FilterOptions {
  searchQuery: string;
  shipper: string;
  dateRange: 'all' | 'today' | 'last7days' | 'last30days' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  weightCategory: 'all' | 'light' | 'medium' | 'heavy'; // light: <5, medium: 5-20, heavy: >20
  sortBy: 'date' | 'name' | 'sender' | 'boxId' | 'tracking' | 'weight' | 'volume';
  sortOrder: 'asc' | 'desc';
}

export const COMMON_SHIPPERS = [
  'DHL Express',
  'FedEx Logistics',
  'UPS Worldwide',
  'USPS Priority',
  'Maersk Logistics',
  'Amazon Freight',
  'DB Schenker',
  'Kuehne + Nagel',
] as const;

export const COMMON_ROUTES = [
  'Copa Airline',
  'American Airline',
  'Sea Shipping',
  'Avianca Cargo',
  'DHL Aviation',
  'Air France Cargo',
  'Ocean Freight Container',
  'Charter Air Freight',
] as const;
