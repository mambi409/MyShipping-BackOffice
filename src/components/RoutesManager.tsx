import React, { useState, useMemo } from 'react';
import {
  Navigation,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  RotateCcw,
  ArrowRight,
  Plane,
  Anchor,
  Compass,
  AlertCircle,
  Box,
  Package,
  Info,
} from 'lucide-react';
import { RouteRecord, BulkBoxRecord, ShipmentRecord } from '../types';

interface RoutesManagerProps {
  routes: RouteRecord[];
  bulkBoxes?: BulkBoxRecord[];
  shipments?: ShipmentRecord[];
  onSaveRoute: (route: RouteRecord) => void;
  onDeleteRoute: (id: string) => void;
  onResetRoutes: () => void;
  onSelectRouteForForm?: (routeName: string) => void;
  onNavigateToBulkBoxes?: () => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const RoutesManager: React.FC<RoutesManagerProps> = ({
  routes,
  bulkBoxes = [],
  shipments = [],
  onSaveRoute,
  onDeleteRoute,
  onResetRoutes,
  onSelectRouteForForm,
  onNavigateToBulkBoxes,
  isModal = false,
  onClose,
}) => {
  const [newRouteName, setNewRouteName] = useState('');
  const [addError, setAddError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editError, setEditError] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRouteName.trim();
    if (!trimmed) {
      setAddError('Please enter a route or remark name.');
      return;
    }

    const duplicate = routes.find(
      (r) => r.name.toLowerCase().trim() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setAddError(`"${trimmed}" already exists in the route list.`);
      return;
    }

    const newRecord: RouteRecord = {
      id: `rt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      createdAt: Date.now(),
    };

    onSaveRoute(newRecord);
    setNewRouteName('');
    setAddError('');
    showToast(`"${trimmed}" added to routes list.`);
  };

  const startEdit = (route: RouteRecord) => {
    setEditingId(route.id);
    setEditingName(route.name);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditError('');
  };

  const saveEdit = (routeId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditError('Route name cannot be empty.');
      return;
    }

    const duplicate = routes.find(
      (r) => r.id !== routeId && r.name.toLowerCase().trim() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setEditError(`"${trimmed}" is already used by another route.`);
      return;
    }

    const existing = routes.find((r) => r.id === routeId);
    if (existing) {
      onSaveRoute({
        ...existing,
        name: trimmed,
      });
      showToast(`Updated to "${trimmed}"`);
    }

    setEditingId(null);
    setEditingName('');
    setEditError('');
  };

  const confirmDelete = (id: string, name: string) => {
    onDeleteRoute(id);
    setDeleteConfirmId(null);
    showToast(`"${name}" removed from routes list.`);
  };

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const q = searchQuery.toLowerCase().trim();
    return routes.filter((r) => r.name.toLowerCase().includes(q));
  }, [routes, searchQuery]);

  const getRouteIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('air') || lower.includes('flight') || lower.includes('copa') || lower.includes('avianca') || lower.includes('plane')) {
      return <Plane className="w-4 h-4 text-sky-600" />;
    }
    if (lower.includes('sea') || lower.includes('ship') || lower.includes('ocean') || lower.includes('marine') || lower.includes('vessel')) {
      return <Anchor className="w-4 h-4 text-teal-600" />;
    }
    return <Compass className="w-4 h-4 text-indigo-600" />;
  };

  const content = (
    <div className="space-y-6" id="routes-manager-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section (only in non-modal view) */}
      {!isModal && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-slate-900" id="routes-page-title">
                Route / Remarks Directory
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {routes.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Simple management list for logistics routes, shipping methods, and carriers (e.g. Copa Airline, American Airline, Sea Shipping).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="reset-routes-list-btn"
              onClick={() => setResetConfirmOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restore Defaults</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Route Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs" id="add-route-card">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Add New Route / Transit Method</span>
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Only the name of the route is required (e.g., <span className="font-semibold text-slate-700">Copa Airline</span>, <span className="font-semibold text-slate-700">American Airline</span>, <span className="font-semibold text-slate-700">Sea Shipping</span>).
        </p>

        <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Navigation className="w-4 h-4" />
            </div>
            <input
              id="new-route-name-input"
              type="text"
              value={newRouteName}
              onChange={(e) => {
                setNewRouteName(e.target.value);
                if (addError) setAddError('');
              }}
              placeholder="e.g. Copa Airline, American Airline, Sea Shipping..."
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors ${
                addError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
              }`}
            />
          </div>

          <button
            type="submit"
            id="submit-add-route-btn"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Route</span>
          </button>
        </form>

        {addError && (
          <p className="text-xs text-rose-600 mt-2 flex items-center gap-1" id="add-route-error">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{addError}</span>
          </p>
        )}

        {/* Quick Suggestion Chips */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="text-[11px] font-medium text-slate-400">Quick additions:</span>
          {['Copa Airline', 'American Airline', 'Sea Shipping', 'Avianca Cargo', 'DHL Aviation', 'Ocean Freight Container'].map((suggestion) => {
            const alreadyExists = routes.some(
              (r) => r.name.toLowerCase() === suggestion.toLowerCase()
            );
            if (alreadyExists) return null;
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  const newRecord: RouteRecord = {
                    id: `rt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
                    name: suggestion,
                    createdAt: Date.now(),
                  };
                  onSaveRoute(newRecord);
                  showToast(`"${suggestion}" added.`);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-medium text-[11px] transition-colors cursor-pointer"
              >
                + {suggestion}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Listing Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs" id="routes-list-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="search-routes-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search route name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono text-right">
            Showing <strong>{filteredRoutes.length}</strong> of {routes.length} routes
          </div>
        </div>

        {/* Informative Consolidation Principle Banner */}
        <div className="mb-4 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-xs text-indigo-950">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong>Bulk Box &amp; Route Consolidation Principle:</strong> Small parcels are consolidated inside <strong>Bulk Boxes</strong>, and each Bulk Box is attached to a designated <strong>Route/Remark</strong> (such as Copa Airline, American Airline, or Sea Shipping) for synchronized air freight or maritime dispatch.
          </div>
        </div>

        {/* Routes List */}
        {filteredRoutes.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Navigation className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No routes match your search</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? `No routes found for "${searchQuery}".` : 'Add your first route above.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden" id="routes-table-rows">
            {filteredRoutes.map((route, index) => {
              const isEditing = editingId === route.id;
              const isDeleting = deleteConfirmId === route.id;

              // Find bulk boxes attached to this route
              const attachedBoxes = bulkBoxes.filter(
                (b) => (b.routeRemarks || '').trim().toLowerCase() === route.name.trim().toLowerCase()
              );
              const boxIdsUpper = new Set(attachedBoxes.map((b) => b.boxId.toUpperCase()));
              const smallPackagesOnRoute = shipments.filter(
                (s) => s.boxId && boxIdsUpper.has(s.boxId.toUpperCase())
              );

              return (
                <div
                  key={route.id}
                  className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors bg-white"
                  id={`route-item-${route.id}`}
                >
                  {/* Left: Name, inline edit, and attached bulk boxes */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xs font-mono text-slate-400 w-5 text-right shrink-0 mt-1">
                      {index + 1}.
                    </span>

                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getRouteIcon(route.name)}
                    </div>

                    {isEditing ? (
                      <div className="flex-1 max-w-md">
                        <div className="flex items-center gap-2">
                          <input
                            id={`inline-edit-route-${route.id}`}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-indigo-400 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(route.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => saveEdit(route.id)}
                            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {editError && <p className="text-xs text-rose-600 mt-1">{editError}</p>}
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {route.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {route.id}
                          </span>
                        </div>

                        {/* Attached Bulk Boxes & Small packages count */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {attachedBoxes.length > 0 ? (
                            <>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                Attached Bulk Boxes:
                              </span>
                              {attachedBoxes.map((b) => (
                                <span
                                  key={b.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/70 text-indigo-700 font-mono text-[11px] font-bold"
                                >
                                  <Box className="w-3 h-3 text-indigo-500" />
                                  <span>{b.boxId}</span>
                                  <span className="text-[9px] font-normal opacity-70">
                                    ({b.status || 'Open'})
                                  </span>
                                </span>
                              ))}
                              <span className="text-[11px] text-slate-500 font-mono">
                                • {smallPackagesOnRoute.length} {smallPackagesOnRoute.length === 1 ? 'package' : 'packages'} consolidated
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                              <Box className="w-3 h-3 text-slate-300" />
                              <span>No bulk boxes attached yet</span>
                              {onNavigateToBulkBoxes && (
                                <button
                                  type="button"
                                  onClick={onNavigateToBulkBoxes}
                                  className="text-indigo-600 hover:text-indigo-800 font-semibold underline not-italic ml-1 cursor-pointer"
                                >
                                  + Attach in Bulk Box Manager
                                </button>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  {!isEditing && (
                    <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-center">
                      {onSelectRouteForForm && (
                        <button
                          type="button"
                          id={`select-route-btn-${route.id}`}
                          onClick={() => onSelectRouteForForm(route.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Select route for form"
                        >
                          <span>Select</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        id={`edit-route-btn-${route.id}`}
                        onClick={() => startEdit(route)}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Edit route name"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {isDeleting ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                          <span className="text-[10px] text-rose-700 font-semibold px-1">Delete?</span>
                          <button
                            type="button"
                            onClick={() => confirmDelete(route.id, route.name)}
                            className="px-2 py-0.5 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs hover:bg-slate-300 cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id={`delete-route-btn-${route.id}`}
                          onClick={() => setDeleteConfirmId(route.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete route"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setResetConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Restore Default Route List?</h3>
            <p className="text-xs text-slate-500 mb-6">
              This will reset the route directory back to the default list (Copa Airline, American Airline, Sea Shipping, etc.). Any custom routes you added will be removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-reset-routes-btn"
                onClick={() => {
                  onResetRoutes();
                  setResetConfirmOpen(false);
                  showToast('Route directory restored to defaults.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
              >
                Restore Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If rendering inside a modal dialog
  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        id="routes-manager-modal-backdrop"
        onClick={onClose}
      >
        <div
          className="bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl my-8 overflow-hidden max-h-[90vh] flex flex-col"
          id="routes-manager-modal-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Route / Remarks Directory
                </h2>
                <p className="text-xs text-slate-500">
                  Manage simple list of transit routes and carrier methods
                </p>
              </div>
            </div>

            <button
              type="button"
              id="close-routes-manager-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content Scrollable */}
          <div className="p-6 overflow-y-auto flex-1">{content}</div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {routes.length} routes registered
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular full page view
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {content}
    </div>
  );
};
