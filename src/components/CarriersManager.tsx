import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  RotateCcw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { CarrierRecord } from '../types';

interface CarriersManagerProps {
  carriers: CarrierRecord[];
  onSaveCarrier: (carrier: CarrierRecord) => void;
  onDeleteCarrier: (id: string) => void;
  onResetCarriers: () => void;
  onSelectCarrierForForm?: (carrierName: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const CarriersManager: React.FC<CarriersManagerProps> = ({
  carriers,
  onSaveCarrier,
  onDeleteCarrier,
  onResetCarriers,
  onSelectCarrierForForm,
  isModal = false,
  onClose,
}) => {
  const [newCarrierName, setNewCarrierName] = useState('');
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
    const trimmed = newCarrierName.trim();
    if (!trimmed) {
      setAddError('Please enter a shipper or carrier name.');
      return;
    }

    const duplicate = carriers.find(
      (c) => c.name.toLowerCase().trim() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setAddError(`"${trimmed}" already exists in the list.`);
      return;
    }

    const newRecord: CarrierRecord = {
      id: `car_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      createdAt: Date.now(),
    };

    onSaveCarrier(newRecord);
    setNewCarrierName('');
    setAddError('');
    showToast(`"${trimmed}" added to shipper list.`);
  };

  const startEdit = (carrier: CarrierRecord) => {
    setEditingId(carrier.id);
    setEditingName(carrier.name);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditError('');
  };

  const saveEdit = (carrierId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditError('Shipper name cannot be empty.');
      return;
    }

    const duplicate = carriers.find(
      (c) => c.id !== carrierId && c.name.toLowerCase().trim() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setEditError(`"${trimmed}" already exists in the list.`);
      return;
    }

    const existing = carriers.find((c) => c.id === carrierId);
    if (existing) {
      onSaveCarrier({ ...existing, name: trimmed });
    }
    setEditingId(null);
    setEditingName('');
    setEditError('');
    showToast(`Renamed to "${trimmed}".`);
  };

  const handleDelete = (id: string, name: string) => {
    onDeleteCarrier(id);
    setDeleteConfirmId(null);
    showToast(`Removed "${name}" from list.`);
  };

  const handleReset = () => {
    onResetCarriers();
    setResetConfirmOpen(false);
    showToast('Reset to default shippers.');
  };

  // Filter carriers
  const filteredCarriers = useMemo(() => {
    if (!searchQuery.trim()) return carriers;
    const q = searchQuery.toLowerCase().trim();
    return carriers.filter((c) => c.name.toLowerCase().includes(q));
  }, [carriers, searchQuery]);

  const content = (
    <div
      className={isModal ? 'p-6 max-h-[85vh] overflow-y-auto' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}
      id="carrier-manager-content"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900" id="carrier-manager-title">
                Shipper / Carrier List
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {carriers.length} Shippers
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage the list of available shippers and carriers for consignments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-reset-carriers-defaults"
            onClick={() => setResetConfirmOpen(true)}
            title="Reset to default shipper names"
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              id="btn-close-carrier-manager-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Toast feedback */}
      {toastMessage && (
        <div
          className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-fadeIn"
          id="carrier-notification-toast"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Add Form */}
      <div className="mb-6 p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200" id="carrier-add-panel">
        <form onSubmit={handleAddSubmit} className="space-y-2" id="carrier-add-form">
          <label htmlFor="input-new-carrier-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Add New Shipper / Carrier
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Truck className="w-4 h-4" />
              </div>
              <input
                id="input-new-carrier-name"
                type="text"
                value={newCarrierName}
                onChange={(e) => {
                  setNewCarrierName(e.target.value);
                  if (addError) setAddError('');
                }}
                placeholder="Enter shipper or carrier name (e.g. Polar Express, Blue Dart)..."
                className={`w-full pl-9 pr-3 py-2.5 bg-white border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                  addError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                }`}
              />
            </div>
            <button
              type="submit"
              id="btn-submit-new-carrier"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shipper</span>
            </button>
          </div>
          {addError && (
            <p className="text-xs text-rose-600 mt-1" id="carrier-add-error">{addError}</p>
          )}
        </form>
      </div>

      {/* Search filter if carriers > 4 */}
      {carriers.length > 4 && (
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="carrier-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shipper by name..."
            className="w-full pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Simple List of Shippers */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="carrier-list-container">
        {filteredCarriers.length === 0 ? (
          <div className="p-8 text-center" id="carrier-empty-state">
            <p className="text-xs text-slate-500">
              {searchQuery
                ? `No shipper found matching "${searchQuery}".`
                : 'The shipper list is empty. Add a shipper name above.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100" id="carrier-items-list">
            {filteredCarriers.map((carrier, index) => {
              const isItemEditing = editingId === carrier.id;

              return (
                <li
                  key={carrier.id}
                  id={`carrier-item-${carrier.id}`}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  {isItemEditing ? (
                    /* Inline Edit Mode */
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1">
                        <input
                          id={`input-edit-carrier-${carrier.id}`}
                          type="text"
                          value={editingName}
                          autoFocus
                          onChange={(e) => {
                            setEditingName(e.target.value);
                            if (editError) setEditError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveEdit(carrier.id);
                            } else if (e.key === 'Escape') {
                              cancelEdit();
                            }
                          }}
                          className={`w-full px-3 py-1.5 bg-white border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                            editError ? 'border-rose-400' : 'border-slate-300'
                          }`}
                        />
                        {editError && (
                          <p className="text-xs text-rose-600 mt-1">{editError}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          id={`btn-save-edit-${carrier.id}`}
                          onClick={() => saveEdit(carrier.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Display Row */
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-slate-400 w-5 text-right shrink-0">
                          {index + 1}.
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {carrier.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onSelectCarrierForForm && (
                          <button
                            type="button"
                            id={`btn-select-carrier-${carrier.id}`}
                            onClick={() => onSelectCarrierForForm(carrier.name)}
                            title="Select for consignment form"
                            className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Use</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          id={`btn-edit-carrier-${carrier.id}`}
                          onClick={() => startEdit(carrier)}
                          title="Rename Shipper"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          id={`btn-delete-carrier-${carrier.id}`}
                          onClick={() => setDeleteConfirmId(carrier.id)}
                          title="Delete Shipper"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-slate-200 animate-scaleUp">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Remove Shipper?</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Remove{' '}
              <strong className="text-slate-800">
                "{carriers.find((c) => c.id === deleteConfirmId)?.name}"
              </strong>{' '}
              from the shipper list? Existing historical records will retain this carrier name.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-carrier"
                onClick={() => {
                  const target = carriers.find((c) => c.id === deleteConfirmId);
                  if (target) handleDelete(target.id, target.name);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-slate-200 animate-scaleUp">
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Reset Shipper List?</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              This will restore the standard default shippers (DHL Express, FedEx, UPS, USPS, Maersk, Amazon Freight, DB Schenker, Kuehne + Nagel).
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-reset-carriers"
                onClick={handleReset}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
