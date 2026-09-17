import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  PlusCircle,
  Eye,
  Trash2,
  Copy,
  Check,
  Package,
  Layers,
  Calendar,
  Truck,
  Scale,
  X,
  RotateCcw,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Navigation,
  ArrowUp,
  ArrowDown,
  Pencil,
  CheckCircle2,
  Box,
  User,
} from 'lucide-react';
import {
  ShipmentRecord,
  FilterOptions,
  COMMON_SHIPPERS,
  CarrierRecord,
  RouteRecord,
  BulkBoxRecord,
} from '../types';
import { exportShipmentsToCSV } from '../utils/storage';
import { EditShipmentModal } from './EditShipmentModal';

interface ShipmentListProps {
  shipments: ShipmentRecord[];
  onOpenDetail: (shipment: ShipmentRecord) => void;
  onDeleteShipment: (id: string) => void;
  onNavigateToForm: () => void;
  onResetData: () => void;
  carriers?: CarrierRecord[];
  routes?: RouteRecord[];
  bulkBoxes?: BulkBoxRecord[];
  onUpdateShipment?: (updated: ShipmentRecord) => void;
  onEditShipmentInForm?: (shipment: ShipmentRecord) => void;
}

export const ShipmentList: React.FC<ShipmentListProps> = ({
  shipments,
  onOpenDetail,
  onDeleteShipment,
  onNavigateToForm,
  onResetData,
  carriers = [],
  routes = [],
  bulkBoxes = [],
  onUpdateShipment,
  onEditShipmentInForm,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [editingShipment, setEditingShipment] = useState<ShipmentRecord | null>(null);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);

  // Filters & Sorting state
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    shipper: 'all',
    dateRange: 'all',
    weightCategory: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Handle column header sort toggle
  const handleSortToggle = (col: FilterOptions['sortBy']) => {
    if (filters.sortBy === col) {
      setFilters((prev) => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        sortBy: col,
        sortOrder: col === 'date' ? 'desc' : 'asc',
      }));
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Compute unique shippers from carriers and existing shipments
  const availableShippers = useMemo(() => {
    const list = new Set<string>();
    if (carriers.length > 0) {
      carriers.forEach((c) => list.add(c.name));
    } else {
      COMMON_SHIPPERS.forEach((s) => list.add(s));
    }
    shipments.forEach((s) => {
      if (s.shipper) list.add(s.shipper);
    });
    return Array.from(list);
  }, [shipments, carriers]);

  // Filter and sort logic
  const filteredAndSortedShipments = useMemo(() => {
    return shipments
      .filter((item) => {
        // 1. Search Query (across tracking, box ID, name, email, userId, taxId, shipper)
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const match =
            item.trackingNumber.toLowerCase().includes(q) ||
            (item.boxId || '').toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q) ||
            item.email.toLowerCase().includes(q) ||
            item.userId.toLowerCase().includes(q) ||
            item.userTaxId.toLowerCase().includes(q) ||
            item.shipper.toLowerCase().includes(q) ||
            (item.routeRemarks ? item.routeRemarks.toLowerCase().includes(q) : false);
          if (!match) return false;
        }

        // 2. Shipper Filter
        if (filters.shipper !== 'all') {
          if (item.shipper.toLowerCase() !== filters.shipper.toLowerCase()) {
            return false;
          }
        }

        // 3. Weight Category Filter
        if (filters.weightCategory !== 'all') {
          // Normalize to kg approx if in lbs
          const weightKg = item.weightUnit === 'lbs' ? item.weight * 0.453592 : item.weight;
          if (filters.weightCategory === 'light' && weightKg >= 5) return false;
          if (filters.weightCategory === 'medium' && (weightKg < 5 || weightKg > 20)) return false;
          if (filters.weightCategory === 'heavy' && weightKg <= 20) return false;
        }

        // 4. Date Range Filter
        if (filters.dateRange !== 'all') {
          const itemDate = new Date(item.currentDate);
          const now = new Date();
          const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);

          if (filters.dateRange === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            if (item.currentDate !== todayStr) return false;
          } else if (filters.dateRange === 'last7days') {
            if (diffDays > 7 || diffDays < 0) return false;
          } else if (filters.dateRange === 'last30days') {
            if (diffDays > 30 || diffDays < 0) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (filters.sortBy === 'date') {
          const timeA = new Date(a.currentDate).getTime() || 0;
          const timeB = new Date(b.currentDate).getTime() || 0;
          comp = timeA - timeB;
        } else if (filters.sortBy === 'boxId') {
          comp = (a.boxId || '').localeCompare(b.boxId || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        } else if (filters.sortBy === 'name' || filters.sortBy === 'sender') {
          comp = (a.name || '').localeCompare(b.name || '', undefined, {
            sensitivity: 'base',
          });
        } else if (filters.sortBy === 'weight') {
          const wtA = a.weightUnit === 'lbs' ? a.weight * 0.453592 : a.weight;
          const wtB = b.weightUnit === 'lbs' ? b.weight * 0.453592 : b.weight;
          comp = wtA - wtB;
        } else if (filters.sortBy === 'volume') {
          const volA = a.length * a.width * a.height;
          const volB = b.length * b.width * b.height;
          comp = volA - volB;
        } else if (filters.sortBy === 'tracking') {
          comp = (a.trackingNumber || '').localeCompare(b.trackingNumber || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        }

        return filters.sortOrder === 'desc' ? -comp : comp;
      });
  }, [shipments, filters]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalCount = shipments.length;
    const totalWeightKg = shipments.reduce((acc, curr) => {
      const wt = curr.weightUnit === 'lbs' ? curr.weight * 0.453592 : curr.weight;
      return acc + wt;
    }, 0);
    const uniqueShippersCount = new Set(shipments.map((s) => s.shipper)).size;

    return {
      totalCount,
      totalWeightKg: totalWeightKg.toFixed(1),
      uniqueShippersCount,
    };
  }, [shipments]);

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.shipper !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.weightCategory !== 'all';

  const resetAllFilters = () => {
    setFilters({
      searchQuery: '',
      shipper: 'all',
      dateRange: 'all',
      weightCategory: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="shipment-list-page">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight" id="list-header-title">
              Submitted Shipment Registry
            </h1>
            <span
              id="list-count-badge"
              className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800"
            >
              {filteredAndSortedShipments.length} {filteredAndSortedShipments.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, and filter all registered parcel consignment submissions and waybills.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="export-csv-btn"
            onClick={() => exportShipmentsToCSV(filteredAndSortedShipments)}
            disabled={filteredAndSortedShipments.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            id="list-add-new-btn"
            onClick={onNavigateToForm}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Shipment Form</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" id="list-stats-strip">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Package className="w-3.5 h-3.5 text-indigo-500" />
            <span>Total Submissions</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Filter className="w-3.5 h-3.5 text-emerald-500" />
            <span>Filtered Matches</span>
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {filteredAndSortedShipments.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span>Total Gross Mass</span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {stats.totalWeightKg} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Truck className="w-3.5 h-3.5 text-blue-500" />
            <span>Active Carriers</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.uniqueShippersCount}</div>
        </div>
      </div>

      {/* Edit Success Notification */}
      {editSuccessMessage && (
        <div
          className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs animate-in fade-in"
          role="status"
          id="list-update-toast"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{editSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setEditSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-800 p-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-xs" id="search-filter-container">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="registry-search-input"
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search by Tracking #, Box ID, Name, Email, User ID, Tax ID, Shipper..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {filters.searchQuery && (
              <button
                type="button"
                id="clear-search-btn"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Buttons & Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Filters Panel */}
            <button
              type="button"
              id="toggle-filter-panel-btn"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                showFilterPanel || hasActiveFilters
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
              )}
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                id="sort-by-select"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value as FilterOptions['sortBy'] }))
                }
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="boxId">Sort: Box ID</option>
                <option value="name">Sort: Sender</option>
                <option value="date">Sort: Date</option>
                <option value="tracking">Sort: Tracking #</option>
                <option value="weight">Sort: Weight</option>
                <option value="volume">Sort: Volume</option>
              </select>
              <button
                type="button"
                id="toggle-sort-order-btn"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))
                }
                title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                className="text-[11px] font-bold text-indigo-600 px-1 hover:text-indigo-800 cursor-pointer uppercase"
              >
                {filters.sortOrder}
              </button>
            </div>

            {/* View Mode Toggle: Table vs Grid */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                id="view-mode-table-btn"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="view-mode-grid-btn"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Sorting Toolbar: Direct 1-click sorting for Box ID and Sender */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs" id="quick-sorting-bar">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span>Quick Sort:</span>
            </span>

            {/* Quick Sort: Box ID */}
            <button
              type="button"
              id="btn-sort-box-id"
              onClick={() => handleSortToggle('boxId')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filters.sortBy === 'boxId'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Click to sort by Box ID (toggle ascending/descending)"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Box ID</span>
              {filters.sortBy === 'boxId' ? (
                filters.sortOrder === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5" />
                )
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-40" />
              )}
            </button>

            {/* Quick Sort: Sender */}
            <button
              type="button"
              id="btn-sort-sender"
              onClick={() => handleSortToggle('name')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filters.sortBy === 'name' || filters.sortBy === 'sender'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Click to sort by Sender (toggle ascending/descending)"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sender</span>
              {filters.sortBy === 'name' || filters.sortBy === 'sender' ? (
                filters.sortOrder === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5" />
                )
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-40" />
              )}
            </button>

            {/* Quick Sort: Date */}
            <button
              type="button"
              id="btn-sort-date"
              onClick={() => handleSortToggle('date')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filters.sortBy === 'date'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Click to sort by Date (toggle ascending/descending)"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Date</span>
              {filters.sortBy === 'date' ? (
                filters.sortOrder === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5" />
                )
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-40" />
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Active: <strong className="text-slate-900">
              {filters.sortBy === 'boxId' ? 'Box ID' : filters.sortBy === 'name' || filters.sortBy === 'sender' ? 'Sender' : filters.sortBy === 'date' ? 'Date' : filters.sortBy}
            </strong> ({filters.sortOrder === 'asc' ? 'Ascending A→Z' : 'Descending Z→A'})
          </div>
        </div>

        {/* Expandable Detailed Filter Drawer */}
        {showFilterPanel && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4" id="detailed-filter-panel">
            {/* Filter by Shipper */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="filter-shipper-select">
                Carrier / Shipper
              </label>
              <select
                id="filter-shipper-select"
                value={filters.shipper}
                onChange={(e) => setFilters((prev) => ({ ...prev, shipper: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Shippers ({availableShippers.length})</option>
                {availableShippers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Date Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="filter-date-range-select">
                Registration Date
              </label>
              <select
                id="filter-date-range-select"
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateRange: e.target.value as FilterOptions['dateRange'] }))
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Registered Today</option>
                <option value="last7days">Past 7 Days</option>
                <option value="last30days">Past 30 Days</option>
              </select>
            </div>

            {/* Filter by Weight Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="filter-weight-select">
                Weight Classification
              </label>
              <select
                id="filter-weight-select"
                value={filters.weightCategory}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    weightCategory: e.target.value as FilterOptions['weightCategory'],
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Weight Classes</option>
                <option value="light">Light (&lt; 5 kg)</option>
                <option value="medium">Medium (5 – 20 kg)</option>
                <option value="heavy">Heavy (&gt; 20 kg)</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Active filters:</span>

            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono text-[11px]">
                Query: "{filters.searchQuery}"
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, searchQuery: '' }))}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.shipper !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold text-[11px]">
                Shipper: {filters.shipper}
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, shipper: 'all' }))}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.dateRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold text-[11px]">
                Date: {filters.dateRange}
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, dateRange: 'all' }))}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.weightCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold text-[11px]">
                Weight: {filters.weightCategory}
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, weightCategory: 'all' }))}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              id="reset-all-filters-btn"
              onClick={resetAllFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Empty States */}
      {filteredAndSortedShipments.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center" id="empty-state-card">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">No Matching Submissions Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {hasActiveFilters
              ? 'No packages match your search criteria or active filters. Try loosening your filter criteria.'
              : 'There are currently no submitted parcel forms stored in the registry.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                id="empty-reset-filters-btn"
                onClick={resetAllFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Clear Search & Filters
              </button>
            ) : (
              <>
                <button
                  type="button"
                  id="empty-create-btn"
                  onClick={onNavigateToForm}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Fill First Entry Form
                </button>
                <button
                  type="button"
                  id="empty-restore-seed-btn"
                  onClick={onResetData}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Sample Records</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Table View (Desktop & Tablet) */}
      {filteredAndSortedShipments.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs" id="shipments-table-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="shipments-data-table">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      id="sort-header-tracking"
                      onClick={() => handleSortToggle('tracking')}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer group"
                    >
                      <span>Tracking Number</span>
                      {filters.sortBy === 'tracking' ? (
                        filters.sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      id="sort-header-box-id"
                      onClick={() => handleSortToggle('boxId')}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer group"
                    >
                      <span>Box ID</span>
                      {filters.sortBy === 'boxId' ? (
                        filters.sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      id="sort-header-sender"
                      onClick={() => handleSortToggle('name')}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer group"
                    >
                      <span>Sender & Email</span>
                      {filters.sortBy === 'name' || filters.sortBy === 'sender' ? (
                        filters.sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">User & Tax ID</th>
                  <th className="py-3.5 px-4">Carrier & Route</th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      id="sort-header-volume"
                      onClick={() => handleSortToggle('volume')}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer group"
                    >
                      <span>Dimensions (L×W×H)</span>
                      {filters.sortBy === 'volume' && (
                        filters.sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600" />
                        )
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      id="sort-header-weight"
                      onClick={() => handleSortToggle('weight')}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer group"
                    >
                      <span>Weight</span>
                      {filters.sortBy === 'weight' ? (
                        filters.sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      id="sort-header-date"
                      onClick={() => handleSortToggle('date')}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer group"
                    >
                      <span>Date</span>
                      {filters.sortBy === 'date' ? (
                        filters.sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedShipments.map((s) => {
                  const volume = (s.length * s.width * s.height).toFixed(0);
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onOpenDetail(s)}
                    >
                      {/* Tracking */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {s.trackingNumber}
                          </span>
                          <button
                            type="button"
                            id={`copy-trk-${s.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(s.trackingNumber, s.id);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Copy Tracking Number"
                          >
                            {copiedId === s.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mt-0.5">
                          {s.status}
                        </span>
                      </td>

                      {/* Box ID & e-Shipping Date */}
                      <td className="py-3.5 px-4">
                        {s.boxId ? (
                          <div className="font-mono text-slate-800 font-bold">{s.boxId}</div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 italic">
                            Unassigned
                          </span>
                        )}
                        {s.eShippingDate && (
                          <div className="text-[10px] text-indigo-700 font-medium flex items-center gap-1 mt-0.5" title="e-Shipping Date">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            <span>e-Ship: {s.eShippingDate}</span>
                          </div>
                        )}
                      </td>

                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-[170px]">{s.email}</div>
                      </td>

                      {/* User ID & Tax ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-700 font-medium">{s.userId}</div>
                        <div className="font-mono text-[10px] text-slate-400">{s.userTaxId}</div>
                      </td>

                      {/* Carrier & Route */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50/80 text-indigo-700 font-semibold text-[11px]">
                            <Truck className="w-3 h-3" />
                            {s.shipper}
                          </span>
                          {s.routeRemarks && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                              <Navigation className="w-2.5 h-2.5 text-slate-500" />
                              <span className="truncate max-w-[130px]">{s.routeRemarks}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dimensions */}
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        <div>
                          {s.length} × {s.width} × {s.height} {s.dimensionUnit}
                        </div>
                        <div className="text-[10px] text-slate-400">Vol: {volume} {s.dimensionUnit}³</div>
                      </td>

                      {/* Weight */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900">
                          {s.weight} {s.weightUnit}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {s.currentDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            id={`edit-record-btn-${s.id}`}
                            onClick={() => setEditingShipment(s)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Submitted Form"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            id={`view-detail-btn-${s.id}`}
                            onClick={() => onOpenDetail(s)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="View Full Waybill Manifest"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            id={`delete-record-btn-${s.id}`}
                            onClick={() => {
                              if (confirm(`Delete consignment record for ${s.trackingNumber}?`)) {
                                onDeleteShipment(s.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View (Mobile & Optional Grid mode) */}
      {filteredAndSortedShipments.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="shipments-grid-view">
          {filteredAndSortedShipments.map((s) => (
            <div
              key={s.id}
              onClick={() => onOpenDetail(s)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                        {s.shipper}
                      </span>
                      {s.routeRemarks && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          <Navigation className="w-2.5 h-2.5 text-slate-500" />
                          <span>{s.routeRemarks}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-mono font-bold text-slate-900 text-sm">{s.trackingNumber}</h3>
                  </div>
                  <div className="text-right">
                    {s.boxId ? (
                      <span className="text-[11px] font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded block">
                        {s.boxId}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic bg-slate-100 px-2 py-0.5 rounded block">
                        Unassigned Box
                      </span>
                    )}
                    {s.eShippingDate && (
                      <span className="text-[10px] text-indigo-700 font-semibold mt-1 block">
                        e-Ship: {s.eShippingDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sender details */}
                <div className="space-y-1 text-xs border-t border-slate-100 pt-3 mb-3">
                  <div className="font-semibold text-slate-900">{s.name}</div>
                  <div className="text-slate-500 text-[11px]">{s.email}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>User: {s.userId}</span>
                    <span>•</span>
                    <span>Tax: {s.userTaxId}</span>
                  </div>
                </div>

                {/* Physical metrics */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs font-mono text-slate-700 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Dimensions</span>
                    <span className="font-semibold">
                      {s.length}×{s.width}×{s.height} {s.dimensionUnit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Weight</span>
                    <span className="font-bold text-slate-900">
                      {s.weight} {s.weightUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {s.currentDate}
                </span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleCopy(s.trackingNumber, s.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Copy Tracking Number"
                  >
                    {copiedId === s.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    id={`grid-edit-btn-${s.id}`}
                    onClick={() => setEditingShipment(s)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                    title="Edit Submitted Form"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(s)}
                    className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete consignment record ${s.trackingNumber}?`)) {
                        onDeleteShipment(s.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info & Restore Data link */}
      <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <p>
          Encrypted Storage Session Active • Showing all client manifest records.
        </p>
        <button
          type="button"
          id="restore-sample-data-footer-btn"
          onClick={onResetData}
          className="hover:text-slate-800 text-slate-500 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset to Default Sample Manifest</span>
        </button>
      </div>

      {/* Edit Submitted Form Modal */}
      {editingShipment && (
        <EditShipmentModal
          isOpen={Boolean(editingShipment)}
          shipment={editingShipment}
          carriers={carriers}
          routes={routes}
          bulkBoxes={bulkBoxes}
          onClose={() => setEditingShipment(null)}
          onOpenInFullForm={(s) => {
            setEditingShipment(null);
            if (onEditShipmentInForm) {
              onEditShipmentInForm(s);
            }
          }}
          onSave={(updated) => {
            if (onUpdateShipment) {
              onUpdateShipment(updated);
            }
            setEditingShipment(null);
            setEditSuccessMessage(`Consignment #${updated.trackingNumber} successfully updated.`);
            setTimeout(() => setEditSuccessMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
};
