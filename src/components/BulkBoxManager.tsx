import React, { useState, useMemo } from 'react';
import {
  Box,
  Calendar,
  Plus,
  Search,
  Trash2,
  Edit3,
  Check,
  X,
  RotateCcw,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  Info,
  Navigation,
  Plane,
  Anchor,
  Truck,
  ChevronDown,
  ChevronUp,
  Scale,
  SlidersHorizontal,
} from 'lucide-react';
import { BulkBoxRecord, ShipmentRecord, AuthSession, RouteRecord } from '../types';
import { DEFAULT_ROUTES } from '../data/mockRoutes';

interface BulkBoxManagerProps {
  bulkBoxes: BulkBoxRecord[];
  shipments: ShipmentRecord[];
  routes?: RouteRecord[];
  session: AuthSession;
  onSaveBulkBox: (box: BulkBoxRecord) => void;
  onDeleteBulkBox: (id: string) => void;
  onResetBulkBoxes: () => void;
  onSelectForShipment?: (box: BulkBoxRecord) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const BulkBoxManager: React.FC<BulkBoxManagerProps> = ({
  bulkBoxes,
  shipments,
  routes = DEFAULT_ROUTES,
  session,
  onSaveBulkBox,
  onDeleteBulkBox,
  onResetBulkBoxes,
  onSelectForShipment,
  isModal = false,
  onCloseModal,
}) => {
  // Available routes list
  const activeRoutes = useMemo(() => {
    return routes && routes.length > 0 ? routes : DEFAULT_ROUTES;
  }, [routes]);

  // New Bulk Box Form state
  const [newBoxId, setNewBoxId] = useState('');
  const [newRouteRemarks, setNewRouteRemarks] = useState(() => activeRoutes[0]?.name || 'Copa Airline');
  const [customNewRoute, setCustomNewRoute] = useState('');
  const [newShippingDate, setNewShippingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [newStatus, setNewStatus] = useState<'Open' | 'Closed' | 'Shipped'>('Open');
  const [formError, setFormError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Closed' | 'Shipped'>('all');
  const [routeFilter, setRouteFilter] = useState<string>('all');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBoxId, setEditBoxId] = useState('');
  const [editRouteRemarks, setEditRouteRemarks] = useState('');
  const [editShippingDate, setEditShippingDate] = useState('');
  const [editStatus, setEditStatus] = useState<'Open' | 'Closed' | 'Shipped'>('Open');

  // Expandable small packages breakdown state
  const [expandedBoxId, setExpandedBoxId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Auto-generate helper
  const handleAutoGenerateId = () => {
    const year = new Date().getFullYear();
    const num = Math.floor(100 + Math.random() * 900);
    setNewBoxId(`BOX-${year}-${num}`);
    setFormError(null);
  };

  // Map of small packages grouped by bulk box ID
  const packagesByBox = useMemo(() => {
    const map: Record<string, ShipmentRecord[]> = {};
    for (const shp of shipments) {
      if (shp.boxId) {
        const key = shp.boxId.toUpperCase();
        if (!map[key]) map[key] = [];
        map[key].push(shp);
      }
    }
    return map;
  }, [shipments]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const totalBoxes = bulkBoxes.length;
    const openBoxes = bulkBoxes.filter((b) => (b.status || 'Open') === 'Open').length;
    const uniqueRoutesWithBoxes = new Set(bulkBoxes.map((b) => b.routeRemarks).filter(Boolean)).size;
    
    // Count small packages consolidated into bulk boxes
    let consolidatedPackagesCount = 0;
    let consolidatedWeightKg = 0;
    for (const shp of shipments) {
      if (shp.boxId) {
        consolidatedPackagesCount++;
        consolidatedWeightKg += shp.weightUnit === 'lbs' ? shp.weight * 0.453592 : shp.weight;
      }
    }

    return {
      totalBoxes,
      openBoxes,
      uniqueRoutesWithBoxes,
      consolidatedPackagesCount,
      consolidatedWeightKg: consolidatedWeightKg.toFixed(1),
    };
  }, [bulkBoxes, shipments]);

  // Filtered bulk boxes
  const filteredBoxes = useMemo(() => {
    return bulkBoxes.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        b.boxId.toLowerCase().includes(q) ||
        b.shippingDate.toLowerCase().includes(q) ||
        (b.routeRemarks && b.routeRemarks.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || (b.status || 'Open') === statusFilter;
      const matchRoute = routeFilter === 'all' || (b.routeRemarks || '') === routeFilter;

      return matchQuery && matchStatus && matchRoute;
    });
  }, [bulkBoxes, searchQuery, statusFilter, routeFilter]);

  const getRouteIcon = (routeName?: string) => {
    if (!routeName) return <Navigation className="w-3.5 h-3.5 text-indigo-500" />;
    const r = routeName.toLowerCase();
    if (r.includes('air') || r.includes('flight') || r.includes('fly') || r.includes('copa') || r.includes('avianca')) {
      return <Plane className="w-3.5 h-3.5 text-indigo-500" />;
    }
    if (r.includes('sea') || r.includes('ocean') || r.includes('maritime') || r.includes('port')) {
      return <Anchor className="w-3.5 h-3.5 text-blue-500" />;
    }
    if (r.includes('truck') || r.includes('road') || r.includes('overland')) {
      return <Truck className="w-3.5 h-3.5 text-emerald-500" />;
    }
    return <Navigation className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedId = newBoxId.trim();
    if (!trimmedId) {
      setFormError('Please enter a Bulk Box ID.');
      return;
    }

    if (!newShippingDate) {
      setFormError('Please select an e-Shipping Date.');
      return;
    }

    const finalRoute = (newRouteRemarks === '__CUSTOM__' ? customNewRoute.trim() : newRouteRemarks.trim());
    if (!finalRoute) {
      setFormError('Please specify the attached Route / Remark for this Bulk Box.');
      return;
    }

    // Check duplicate
    const exists = bulkBoxes.some((b) => b.boxId.toUpperCase() === trimmedId.toUpperCase());
    if (exists) {
      setFormError(`Bulk Box ID "${trimmedId}" already exists. Please use a unique ID.`);
      return;
    }

    const newRecord: BulkBoxRecord = {
      id: `bbox_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
      boxId: trimmedId,
      routeRemarks: finalRoute,
      shippingDate: newShippingDate,
      status: newStatus,
      createdAt: Date.now(),
      createdBy: session.username || 'admin',
    };

    onSaveBulkBox(newRecord);
    setNewBoxId('');
    setCustomNewRoute('');
    setSuccessBanner(
      `Bulk Box ID "${trimmedId}" attached to Route "${finalRoute}" with e-Shipping Date ${newShippingDate} has been created.`
    );
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const startEdit = (b: BulkBoxRecord) => {
    setEditingId(b.id);
    setEditBoxId(b.boxId);
    setEditRouteRemarks(b.routeRemarks || activeRoutes[0]?.name || 'Copa Airline');
    setEditShippingDate(b.shippingDate);
    setEditStatus(b.status || 'Open');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (b: BulkBoxRecord) => {
    if (!editBoxId.trim() || !editShippingDate) return;

    // Check conflict with other records
    const conflict = bulkBoxes.some(
      (other) => other.id !== b.id && other.boxId.toUpperCase() === editBoxId.trim().toUpperCase()
    );
    if (conflict) {
      alert(`Bulk Box ID "${editBoxId.trim()}" is already in use by another record.`);
      return;
    }

    onSaveBulkBox({
      ...b,
      boxId: editBoxId.trim(),
      routeRemarks: editRouteRemarks.trim() || undefined,
      shippingDate: editShippingDate,
      status: editStatus,
    });
    setEditingId(null);
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const content = (
    <div className="space-y-6" id="bulk-box-manager-content">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bulk Box &amp; Route Consolidation Control</span>
            </span>
            <span className="text-xs text-slate-400">
              Operator: <strong className="text-slate-200">{session.username}</strong> ({session.role})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Box className="w-6 h-6 text-indigo-400" />
            <span>Bulk Box ID &amp; Route/Remark Registry</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Administer consolidated master bulk containers. <strong>Bulk Boxes are attached to Route/Remark</strong> because small packages are grouped and dispatched in bulk containers via designated airline and maritime routes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-reset-bulk-boxes"
            onClick={() => setResetConfirm(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Consolidation Architecture Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Bulk Boxes</span>
            <Box className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.totalBoxes}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.openBoxes} open containers</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Attached Routes</span>
            <Navigation className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.uniqueRoutesWithBoxes}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Airline &amp; sea lanes covered</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Consolidated Parcels</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.consolidatedPackagesCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Small packages in boxes</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Consolidated Mass</span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.consolidatedWeightKg} kg</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total consolidated freight</p>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {resetConfirm && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-medium">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Restore standard sample Bulk Box IDs attached to default Airline and Sea routes?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onResetBulkBoxes();
                setResetConfirm(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer"
            >
              Confirm Reset
            </button>
            <button
              type="button"
              onClick={() => setResetConfirm(false)}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Admin Bulk Box Creation Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs" id="create-bulk-box-card">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Create Bulk Box &amp; Attach to Route/Remark</h2>
              <p className="text-xs text-slate-500">
                Register a container Box ID, link it to a transit Route/Remark, and set its scheduled e-Shipping date
              </p>
            </div>
          </div>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <X className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4" id="form-create-bulk-box">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Box ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="input-bulk-box-id">
                  Bulk Box ID <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  id="btn-auto-gen-bulk-box"
                  onClick={handleAutoGenerateId}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Box className="w-4 h-4" />
                </div>
                <input
                  id="input-bulk-box-id"
                  type="text"
                  value={newBoxId}
                  onChange={(e) => {
                    setNewBoxId(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. BOX-2026-050"
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>
            </div>

            {/* Attached Route / Remark */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="select-bulk-route">
                Attached Route / Remark <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Navigation className="w-4 h-4" />
                </div>
                <select
                  id="select-bulk-route"
                  value={newRouteRemarks}
                  onChange={(e) => setNewRouteRemarks(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  required
                >
                  <optgroup label="Authorized Transit Routes">
                    {activeRoutes.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other">
                    <option value="__CUSTOM__">+ Specify Custom Route...</option>
                  </optgroup>
                </select>
              </div>
              {newRouteRemarks === '__CUSTOM__' && (
                <input
                  type="text"
                  value={customNewRoute}
                  onChange={(e) => setCustomNewRoute(e.target.value)}
                  placeholder="Enter transit route name..."
                  className="w-full mt-2 px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  required
                />
              )}
            </div>

            {/* e-Shipping Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="input-bulk-shipping-date">
                e-Shipping Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="input-bulk-shipping-date"
                  type="date"
                  value={newShippingDate}
                  onChange={(e) => {
                    setNewShippingDate(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="select-bulk-status">
                Container Status
              </label>
              <select
                id="select-bulk-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'Open' | 'Closed' | 'Shipped')}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
              >
                <option value="Open">Open (Accepting Small Packages)</option>
                <option value="Closed">Closed (Sealed Container)</option>
                <option value="Shipped">Shipped (In Transit)</option>
              </select>
            </div>
          </div>

          {/* Helper clarification banner */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center gap-2 text-xs text-indigo-900">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Consolidation Rule:</strong> Small individual packages are assigned to this Bulk Box and inherit its designated Route/Remark for manifest grouping and transport dispatch.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              id="btn-submit-new-bulk-box"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Bulk Box &amp; Attach Route</span>
            </button>
          </div>
        </form>
      </div>

      {/* Directory & Management View */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs" id="bulk-boxes-table-card">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="search-bulk-boxes-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Bulk Box ID, attached route, shipping date..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter by Route */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
              <Navigation className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-500 text-[11px] font-medium">Route:</span>
              <select
                id="filter-bulk-box-route"
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Routes</option>
                {activeRoutes.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              {(['all', 'Open', 'Closed', 'Shipped'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
                    statusFilter === st ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' ? 'All Status' : st}
                </button>
              ))}
            </div>

            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-600 font-semibold text-xs">
              {filteredBoxes.length} {filteredBoxes.length === 1 ? 'Box' : 'Boxes'}
            </span>
          </div>
        </div>

        {/* List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="bulk-boxes-table">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Bulk Box ID</th>
                <th className="py-3 px-4">Attached Route / Remark</th>
                <th className="py-3 px-4">e-Shipping Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Consolidated Small Packages</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBoxes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Box className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No Bulk Boxes found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchQuery || routeFilter !== 'all'
                        ? 'Try adjusting your search or route filter criteria'
                        : 'Create your first Bulk Box ID above'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBoxes.map((box) => {
                  const isEditing = editingId === box.id;
                  const smallPackages = packagesByBox[box.boxId.toUpperCase()] || [];
                  const isExpanded = expandedBoxId === box.id;
                  const totalKg = smallPackages
                    .reduce((sum, p) => sum + (p.weightUnit === 'lbs' ? p.weight * 0.453592 : p.weight), 0)
                    .toFixed(1);

                  if (isEditing) {
                    return (
                      <tr key={box.id} className="bg-indigo-50/40">
                        {/* Edit Box ID */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editBoxId}
                            onChange={(e) => setEditBoxId(e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-indigo-300 bg-white font-mono font-bold text-xs w-36"
                          />
                        </td>

                        {/* Edit Route / Remarks */}
                        <td className="py-3 px-4">
                          <select
                            value={editRouteRemarks}
                            onChange={(e) => setEditRouteRemarks(e.target.value)}
                            className="px-2 py-1 rounded-lg border border-indigo-300 bg-white text-xs font-semibold"
                          >
                            {activeRoutes.map((r) => (
                              <option key={r.id} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Edit Shipping Date */}
                        <td className="py-3 px-4">
                          <input
                            type="date"
                            value={editShippingDate}
                            onChange={(e) => setEditShippingDate(e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-indigo-300 bg-white font-mono text-xs"
                          />
                        </td>

                        {/* Edit Status */}
                        <td className="py-3 px-4">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as 'Open' | 'Closed' | 'Shipped')}
                            className="px-2 py-1 rounded-lg border border-indigo-300 bg-white text-xs"
                          >
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                            <option value="Shipped">Shipped</option>
                          </select>
                        </td>

                        {/* Small Packages Count */}
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {smallPackages.length} packages ({totalKg} kg)
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => saveEdit(box)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <React.Fragment key={box.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* Bulk Box ID */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                              <Box className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div>
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                {box.boxId}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Attached Route / Remark */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-xs">
                            {getRouteIcon(box.routeRemarks)}
                            <span>{box.routeRemarks || 'General Route'}</span>
                          </div>
                        </td>

                        {/* e-Shipping Date */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="font-mono font-semibold">
                              {formatDisplayDate(box.shippingDate)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono ml-1">
                              ({box.shippingDate})
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              box.status === 'Closed'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : box.status === 'Shipped'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                box.status === 'Closed'
                                  ? 'bg-slate-400'
                                  : box.status === 'Shipped'
                                  ? 'bg-blue-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <span>{box.status || 'Open'}</span>
                          </span>
                        </td>

                        {/* Consolidated Small Packages with Expand toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setExpandedBoxId(isExpanded ? null : box.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                              smallPackages.length > 0
                                ? isExpanded
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                            title={isExpanded ? 'Collapse packages view' : 'View small packages packed in this bulk box'}
                          >
                            <Package className="w-3 h-3" />
                            <span>
                              {smallPackages.length} {smallPackages.length === 1 ? 'pkg' : 'pkgs'}
                            </span>
                            <span className="text-[10px] opacity-75">({totalKg} kg)</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 ml-0.5" />
                            ) : (
                              <ChevronDown className="w-3 h-3 ml-0.5" />
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {onSelectForShipment && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectForShipment(box);
                                  if (onCloseModal) onCloseModal();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                title="Use this Bulk Box in Shipment Form"
                              >
                                <span>Use in Form</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => startEdit(box)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit Bulk Box & Route"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {deleteConfirmId === box.id ? (
                              <div className="inline-flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                                <span className="text-[10px] text-rose-700 font-bold px-1">Delete?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteBulkBox(box.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 cursor-pointer"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] hover:bg-slate-300 cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(box.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Bulk Box"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable row: Small Packages Consolidated Inside this Bulk Box */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={6} className="p-4 pl-12">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Package className="w-3.5 h-3.5" />
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-900">
                                    Small Packages Packed in Bulk Box <span className="font-mono text-indigo-700">{box.boxId}</span>
                                  </h4>
                                  <span className="text-[11px] text-slate-500">
                                    (All routed via: <strong className="text-slate-800">{box.routeRemarks || 'General Route'}</strong>)
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-slate-500">
                                  Total: {smallPackages.length} items • {totalKg} kg
                                </span>
                              </div>

                              {smallPackages.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">
                                  No small packages currently assigned to this bulk box. Select this Box ID in the shipment entry form to assign small parcels.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {smallPackages.map((shp) => (
                                    <div
                                      key={shp.id}
                                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex flex-col justify-between gap-1.5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                                          {shp.trackingNumber}
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          {shp.status}
                                        </span>
                                      </div>
                                      <div className="text-slate-700 font-medium truncate">
                                        {shp.name}
                                      </div>
                                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200/60">
                                        <span>{shp.length}×{shp.width}×{shp.height} {shp.dimensionUnit}</span>
                                        <strong className="text-slate-800">{shp.weight} {shp.weightUnit}</strong>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        onClick={onCloseModal}
      >
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                Bulk Box ID &amp; Route/Remark Registry
              </h3>
            </div>
            {onCloseModal && (
              <button
                type="button"
                onClick={onCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {content}
    </div>
  );
};
