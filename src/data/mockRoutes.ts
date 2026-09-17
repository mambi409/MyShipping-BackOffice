import { RouteRecord } from '../types';

export const DEFAULT_ROUTES: RouteRecord[] = [
  {
    id: 'route_copa',
    name: 'Copa Airline',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'route_aa',
    name: 'American Airline',
    createdAt: Date.now() - 86400000 * 9,
  },
  {
    id: 'route_sea',
    name: 'Sea Shipping',
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'route_avianca',
    name: 'Avianca Cargo',
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'route_dhl_av',
    name: 'DHL Aviation',
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'route_air_france',
    name: 'Air France Cargo',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'route_ocean_container',
    name: 'Ocean Freight Container',
    createdAt: Date.now() - 86400000 * 4,
  },
];
