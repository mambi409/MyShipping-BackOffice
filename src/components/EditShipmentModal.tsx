import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Truck,
  Navigation,
  Box,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Mail,
  CreditCard,
  Building2,
  Maximize2,
  Scale,
  Save,
} from 'lucide-react';
import {
  ShipmentRecord,
  CarrierRecord,
  RouteRecord,
  BulkBoxRecord,
  COMMON_SHIPPERS,
  COMMON_ROUTES,
} from '../types';

interface EditShipmentModalProps {
  isOpen: boolean;
  shipment: ShipmentRecord | null;
  carriers: CarrierRecord[];
  routes: RouteRecord[];
  bulkBoxes: BulkBoxRecord[];
  onClose: () => void;
  onSave: (updated: ShipmentRecord) => void;
  onOpenInFullForm?: (shipment: ShipmentRecord) => void;
}

export const EditShipmentModal: React.FC<EditShipmentModalProps> = ({
  isOpen,
  shipment,
  carriers,
  routes,
  bulkBoxes,
  onClose,
  onSave,
  onOpenInFullForm,
}) => {
  if (!isOpen || !shipment) return null;

  const [name, setName] = useState(shipment.name);
  const [email, setEmail] = useState(shipment.email);
  const [userId, setUserId] = useState(shipment.userId);
  const [userTaxId, setUserTaxId] = useState(shipment.userTaxId);
  const [currentDate, setCurrentDate] = useState(shipment.currentDate);
  const [shipper, setShipper] = useState(shipment.shipper);
  const [customShipper, setCustomShipper] = useState('');
  const [boxId, setBoxId] = useState(shipment.boxId);
  const [eShippingDate, setEShippingDate] = useState(shipment.eShippingDate || '');
  const [length, setLength] = useState(shipment.length.toString());
  const [width, setWidth] = useState(shipment.width.toString());
  const [height, setHeight] = useState(shipment.height.toString());
  const [weight, setWeight] = useState(shipment.weight.toString());
  const [dimensionUnit, setDimensionUnit] = useState<'cm' | 'in'>(shipment.dimensionUnit);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(shipment.weightUnit);
  const [status, setStatus] = useState<ShipmentRecord['status']>(shipment.status);
  const [notes, setNotes] = useState(shipment.notes || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form if shipment changes
  useEffect(() => {
    if (shipment) {
      setName(shipment.name);
      setEmail(shipment.email);
      setUserId(shipment.userId);
      setUserTaxId(shipment.userTaxId);
      setCurrentDate(shipment.currentDate);

      // Check if shipper exists in options
      const knownCarriers = carriers.map((c) => c.name);
      const allKnownShippers = Array.from(new Set([...knownCarriers, ...COMMON_SHIPPERS]));
      if (allKnownShippers.includes(shipment.shipper)) {
        setShipper(shipment.shipper);
        setCustomShipper('');
      } else {
        setShipper('Other');
        setCustomShipper(shipment.shipper);
      }

      setBoxId(shipment.boxId);
      setEShippingDate(shipment.eShippingDate || '');
      setLength(shipment.length.toString());
      setWidth(shipment.width.toString());
      setHeight(shipment.height.toString());
      setWeight(shipment.weight.toString());
      setDimensionUnit(shipment.dimensionUnit);
      setWeightUnit(shipment.weightUnit);
      setStatus(shipment.status);
      setNotes(shipment.notes || '');
      setErrors({});
    }
  }, [shipment, carriers, routes]);

  // Handle Box ID selection and auto eShippingDate
  const handleBoxSelect = (selectedBoxId: string) => {
    setBoxId(selectedBoxId);
    if (!selectedBoxId) {
      setEShippingDate('');
      if (errors.boxId) setErrors((prev) => ({ ...prev, boxId: '' }));
      return;
    }
    const matching = bulkBoxes.find((b) => b.boxId.toUpperCase() === selectedBoxId.toUpperCase());
    if (matching?.shippingDate) {
      setEShippingDate(matching.shippingDate);
    }
    if (errors.boxId) setErrors((prev) => ({ ...prev, boxId: '' }));
  };

  // Volumetric weight calculation
  const numLength = parseFloat(length) || 0;
  const numWidth = parseFloat(width) || 0;
  const numHeight = parseFloat(height) || 0;
  const numWeight = parseFloat(weight) || 0;

  const calcVolumetric = () => {
    if (numLength <= 0 || numWidth <= 0 || numHeight <= 0) return 0;
    if (dimensionUnit === 'cm') {
      return (numLength * numWidth * numHeight) / 5000;
    } else {
      return (numLength * numWidth * numHeight) / 139;
    }
  };
  const volumetricWeight = calcVolumetric();

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = 'Sender name is required';
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Invalid email format';
    }

    if (!userId.trim()) errs.userId = 'User ID is required';
    if (!userTaxId.trim()) errs.userTaxId = 'Tax ID is required';

    const effectiveShipper = shipper === 'Other' ? customShipper.trim() : shipper;
    if (!effectiveShipper) errs.shipper = 'Shipper / Carrier is required';

    // Bulk Box ID is optional
    if (!currentDate) errs.currentDate = 'Current date is required';

    if (isNaN(numLength) || numLength <= 0) errs.length = 'Must be > 0';
    if (isNaN(numWidth) || numWidth <= 0) errs.width = 'Must be > 0';
    if (isNaN(numHeight) || numHeight <= 0) errs.height = 'Must be > 0';
    if (isNaN(numWeight) || numWeight <= 0) errs.weight = 'Must be > 0';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalShipper = shipper === 'Other' ? customShipper.trim() : shipper;
    const matching = bulkBoxes.find((b) => b.boxId.toUpperCase() === boxId.trim().toUpperCase());
    const finalRoute = matching?.routeRemarks || shipment.routeRemarks || undefined;

    const updated: ShipmentRecord = {
      ...shipment,
      name: name.trim(),
      email: email.trim(),
      userId: userId.trim(),
      userTaxId: userTaxId.trim(),
      currentDate,
      length: numLength,
      width: numWidth,
      height: numHeight,
      weight: numWeight,
      dimensionUnit,
      weightUnit,
      shipper: finalShipper,
      routeRemarks: finalRoute,
      boxId: boxId.trim(),
      eShippingDate: eShippingDate || undefined,
      status,
      notes: notes.trim() || undefined,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      id="edit-shipment-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-shipment-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
                {shipment.trackingNumber}
              </span>
              <h2 className="text-base font-bold text-slate-900" id="edit-shipment-title">
                Edit Submitted Consignment
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify consignment details and recalculate dimensional metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            id="close-edit-shipment-modal-btn"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[calc(85vh-130px)] overflow-y-auto">
          {/* Section 1: Sender & Customer ID */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sender & Account Identification</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sender Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-field-name">
                  Sender / Consignor Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="edit-field-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
              </div>

              {/* Sender Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-field-email">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="edit-field-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
              </div>

              {/* User ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-field-userId">
                  Client / User ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="edit-field-userId"
                    type="text"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      if (errors.userId) setErrors((prev) => ({ ...prev, userId: '' }));
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                </div>
                {errors.userId && <p className="text-xs text-rose-600 mt-1">{errors.userId}</p>}
              </div>

              {/* User Tax ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-field-userTaxId">
                  Tax / Customs ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="edit-field-userTaxId"
                    type="text"
                    value={userTaxId}
                    onChange={(e) => {
                      setUserTaxId(e.target.value);
                      if (errors.userTaxId) setErrors((prev) => ({ ...prev, userTaxId: '' }));
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                </div>
                {errors.userTaxId && <p className="text-xs text-rose-600 mt-1">{errors.userTaxId}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Carrier, Route & Bulk Box */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Routing & Bulk Box Allocation</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Carrier / Shipper */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-field-shipper">
                  Carrier / Shipper <span className="text-rose-500">*</span>
                </label>
                <select
                  id="edit-field-shipper"
                  value={shipper}
                  onChange={(e) => {
                    setShipper(e.target.value);
                    if (errors.shipper) setErrors((prev) => ({ ...prev, shipper: '' }));
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <optgroup label="Registered Carriers">
                    {carriers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other Carriers">
                    <option value="Other">Other (Custom Carrier)</option>
                  </optgroup>
                </select>
                {shipper === 'Other' && (
                  <input
                    type="text"
                    value={customShipper}
                    onChange={(e) => setCustomShipper(e.target.value)}
                    placeholder="Enter carrier name"
                    className="mt-2 w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                )}
                {errors.shipper && <p className="text-xs text-rose-600 mt-1">{errors.shipper}</p>}
              </div>

              {/* Bulk Box ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-field-boxId">
                  Bulk Box ID <span className="text-slate-400 font-normal text-[11px] normal-case">(Optional - unassigned allowed)</span>
                </label>
                <div className="space-y-2">
                  <select
                    id="edit-field-boxId-select"
                    value={!boxId ? '' : bulkBoxes.some((b) => b.boxId.toUpperCase() === boxId.toUpperCase()) ? boxId : '__CUSTOM__'}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        // keep current boxId or allow editing
                      } else {
                        handleBoxSelect(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  >
                    <option value="" className="font-sans text-slate-500">
                      -- No Bulk Box Assigned (Unassigned) --
                    </option>
                    <optgroup label="Available Bulk Boxes (with Attached Routes)">
                      {bulkBoxes.map((b) => (
                        <option key={b.id} value={b.boxId}>
                          {b.boxId} • {b.routeRemarks ? `Route: ${b.routeRemarks}` : 'General Route'} • e-Ship: {b.shippingDate}
                        </option>
                      ))}
                    </optgroup>
                    <option value="__CUSTOM__">Manual / Custom Box ID...</option>
                  </select>

                  <input
                    id="edit-field-boxId-input"
                    type="text"
                    value={boxId}
                    onChange={(e) => {
                      setBoxId(e.target.value);
                      if (errors.boxId) setErrors((prev) => ({ ...prev, boxId: '' }));
                    }}
                    placeholder="Enter Box ID (e.g. BOX-SEA-001)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>
                {errors.boxId && <p className="text-xs text-rose-600 mt-1">{errors.boxId}</p>}
              </div>

              {/* Status & e-Shipping Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-field-status">
                  Consignment Status
                </label>
                <select
                  id="edit-field-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ShipmentRecord['status'])}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Received">Received</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="On Hold">On Hold</option>
                </select>

                {eShippingDate && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>e-Shipping Date: {eShippingDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Physical Dimensions & Weight */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dimensions, Weight & Date</span>
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setDimensionUnit('cm')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      dimensionUnit === 'cm' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setDimensionUnit('in')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      dimensionUnit === 'in' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    in
                  </button>
                </div>

                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setWeightUnit('kg')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      weightUnit === 'kg' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit('lbs')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      weightUnit === 'lbs' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1" htmlFor="edit-field-length">
                  Length ({dimensionUnit}) *
                </label>
                <input
                  id="edit-field-length"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={length}
                  onChange={(e) => {
                    setLength(e.target.value);
                    if (errors.length) setErrors((prev) => ({ ...prev, length: '' }));
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                {errors.length && <p className="text-[10px] text-rose-600 mt-0.5">{errors.length}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1" htmlFor="edit-field-width">
                  Width ({dimensionUnit}) *
                </label>
                <input
                  id="edit-field-width"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={width}
                  onChange={(e) => {
                    setWidth(e.target.value);
                    if (errors.width) setErrors((prev) => ({ ...prev, width: '' }));
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                {errors.width && <p className="text-[10px] text-rose-600 mt-0.5">{errors.width}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1" htmlFor="edit-field-height">
                  Height ({dimensionUnit}) *
                </label>
                <input
                  id="edit-field-height"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value);
                    if (errors.height) setErrors((prev) => ({ ...prev, height: '' }));
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                {errors.height && <p className="text-[10px] text-rose-600 mt-0.5">{errors.height}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1" htmlFor="edit-field-weight">
                  Weight ({weightUnit}) *
                </label>
                <input
                  id="edit-field-weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    if (errors.weight) setErrors((prev) => ({ ...prev, weight: '' }));
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                {errors.weight && <p className="text-[10px] text-rose-600 mt-0.5">{errors.weight}</p>}
              </div>
            </div>

            {/* Dimensional Summary & Date */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-600">
                  Volumetric: <strong>{volumetricWeight.toFixed(2)} {weightUnit}</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">
                  Billable: <strong>{Math.max(numWeight, volumetricWeight).toFixed(2)} {weightUnit}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="edit-field-date" className="text-slate-600 font-medium">
                  Date:
                </label>
                <input
                  id="edit-field-date"
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Notes / Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-field-notes">
              Consignment Notes / Special Instructions
            </label>
            <textarea
              id="edit-field-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fragile glass, temperature sensitive, handle with care..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              {onOpenInFullForm && (
                <button
                  type="button"
                  id="open-in-full-form-btn"
                  onClick={() => {
                    onOpenInFullForm(shipment);
                    onClose();
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open in Full Form Editor</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="cancel-edit-shipment-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-edit-shipment-btn"
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
