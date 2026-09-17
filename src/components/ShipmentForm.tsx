import React, { useState, useEffect } from 'react';
import {
  Package,
  User,
  Mail,
  Hash,
  CreditCard,
  Calendar,
  Box,
  Truck,
  Maximize2,
  Scale,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Info,
  Users,
  UserPlus,
  SlidersHorizontal,
  BookmarkPlus,
  Check,
  Navigation,
} from 'lucide-react';
import {
  ShipmentRecord,
  COMMON_SHIPPERS,
  COMMON_ROUTES,
  SenderRecord,
  CarrierRecord,
  BulkBoxRecord,
  RouteRecord,
  AuthSession,
} from '../types';
import { SendersManager } from './SendersManager';
import { CarriersManager } from './CarriersManager';
import { BulkBoxManager } from './BulkBoxManager';

interface ShipmentFormProps {
  onFormSubmit: (shipment: ShipmentRecord) => void;
  onViewList: () => void;
  senders?: SenderRecord[];
  onSaveSender?: (sender: SenderRecord) => void;
  onDeleteSender?: (id: string) => void;
  onResetSenders?: () => void;
  preselectedSender?: SenderRecord | null;
  onNavigateToSenders?: () => void;
  carriers?: CarrierRecord[];
  onSaveCarrier?: (carrier: CarrierRecord) => void;
  onDeleteCarrier?: (id: string) => void;
  onResetCarriers?: () => void;
  preselectedCarrier?: string | null;
  onNavigateToCarriers?: () => void;
  bulkBoxes?: BulkBoxRecord[];
  onSaveBulkBox?: (box: BulkBoxRecord) => void;
  onDeleteBulkBox?: (id: string) => void;
  onResetBulkBoxes?: () => void;
  preselectedBulkBox?: BulkBoxRecord | null;
  onNavigateToBulkBoxes?: () => void;
  routes?: RouteRecord[];
  onSaveRoute?: (route: RouteRecord) => void;
  onDeleteRoute?: (id: string) => void;
  onResetRoutes?: () => void;
  preselectedRoute?: string | null;
  onNavigateToRoutes?: () => void;
  session?: AuthSession;
  editingShipment?: ShipmentRecord | null;
  onCancelEdit?: () => void;
}

export const ShipmentForm: React.FC<ShipmentFormProps> = ({
  onFormSubmit,
  onViewList,
  senders = [],
  onSaveSender,
  onDeleteSender,
  onResetSenders,
  preselectedSender,
  onNavigateToSenders,
  carriers = [],
  onSaveCarrier,
  onDeleteCarrier,
  onResetCarriers,
  preselectedCarrier,
  onNavigateToCarriers,
  bulkBoxes = [],
  onSaveBulkBox,
  onDeleteBulkBox,
  onResetBulkBoxes,
  preselectedBulkBox,
  onNavigateToBulkBoxes,
  routes = [],
  onSaveRoute,
  onDeleteRoute,
  onResetRoutes,
  preselectedRoute,
  onNavigateToRoutes,
  session = { isAuthenticated: true, username: 'admin', role: 'Administrator', loginTime: '' },
  editingShipment = null,
  onCancelEdit,
}) => {
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [userId, setUserId] = useState('');
  const [userTaxId, setUserTaxId] = useState('');
  const [currentDate, setCurrentDate] = useState(getTodayString());
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [dimensionUnit, setDimensionUnit] = useState<'cm' | 'in'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [shipper, setShipper] = useState<string>(() => {
    if (carriers.length > 0) return carriers[0].name;
    return COMMON_SHIPPERS[0];
  });
  const [customShipper, setCustomShipper] = useState('');
  const [boxId, setBoxId] = useState('');
  const [notes, setNotes] = useState('');

  // Sender selection state
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [isSenderManagerOpen, setIsSenderManagerOpen] = useState(false);
  const [quickSaveMessage, setQuickSaveMessage] = useState<string | null>(null);

  // Carrier management state
  const [isCarrierManagerOpen, setIsCarrierManagerOpen] = useState(false);
  const [quickCarrierSaveMessage, setQuickCarrierSaveMessage] = useState<string | null>(null);

  // Bulk Box management state
  const [selectedBulkBoxMode, setSelectedBulkBoxMode] = useState<'existing' | 'custom'>('existing');
  const [customBoxId, setCustomBoxId] = useState('');
  const [customBoxRoute, setCustomBoxRoute] = useState(() => routes[0]?.name || COMMON_ROUTES[0]);
  const [customShippingDate, setCustomShippingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [isBulkBoxManagerOpen, setIsBulkBoxManagerOpen] = useState(false);
  const [quickBulkBoxSaveMessage, setQuickBulkBoxSaveMessage] = useState<string | null>(null);

  // Handle preselected carrier from carrier list
  useEffect(() => {
    if (preselectedCarrier) {
      setShipper(preselectedCarrier);
      setCustomShipper('');
    }
  }, [preselectedCarrier]);

  // Handle explicitly preselected bulk box (e.g. from Bulk Box Manager "Use in Form")
  useEffect(() => {
    if (editingShipment) {
      // Populated via editingShipment effect below
      return;
    }
    if (preselectedBulkBox) {
      setBoxId(preselectedBulkBox.boxId);
      setSelectedBulkBoxMode('existing');
    }
    // Note: Bulk Box is NOT auto-populated on new entry because the destination bulk box may not be determined yet.
  }, [preselectedBulkBox, editingShipment]);

  // When editingShipment changes, populate all form fields
  useEffect(() => {
    if (editingShipment) {
      setName(editingShipment.name);
      setEmail(editingShipment.email);
      setTrackingNumber(editingShipment.trackingNumber);
      setUserId(editingShipment.userId);
      setUserTaxId(editingShipment.userTaxId);
      setCurrentDate(editingShipment.currentDate);
      setLength(editingShipment.length.toString());
      setWidth(editingShipment.width.toString());
      setHeight(editingShipment.height.toString());
      setWeight(editingShipment.weight.toString());
      setDimensionUnit(editingShipment.dimensionUnit);
      setWeightUnit(editingShipment.weightUnit);
      setNotes(editingShipment.notes || '');

      // Shipper
      const knownShippers = [...carriers.map((c) => c.name), ...COMMON_SHIPPERS];
      if (knownShippers.includes(editingShipment.shipper)) {
        setShipper(editingShipment.shipper);
        setCustomShipper('');
      } else {
        setShipper('Other');
        setCustomShipper(editingShipment.shipper);
      }

      // Box ID
      setBoxId(editingShipment.boxId || '');
      const isExistingBox = bulkBoxes.some(
        (b) => b.boxId.toUpperCase() === editingShipment.boxId.toUpperCase()
      );
      if (isExistingBox) {
        setSelectedBulkBoxMode('existing');
      } else {
        setSelectedBulkBoxMode('custom');
        setCustomBoxId(editingShipment.boxId);
      }
      setErrors({});
      setSubmittedRecord(null);
    }
  }, [editingShipment, carriers, routes, bulkBoxes]);

  // Auto-populate helper
  const applySender = (sender: SenderRecord) => {
    setSelectedSenderId(sender.id);
    setName(sender.name);
    setEmail(sender.email);
    setUserId(sender.userId);
    setUserTaxId(sender.userTaxId);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.name;
      delete next.email;
      delete next.userId;
      delete next.userTaxId;
      return next;
    });
  };

  // Sync if preselected from external sender directory
  useEffect(() => {
    if (preselectedSender) {
      applySender(preselectedSender);
    }
  }, [preselectedSender]);

  const handleSenderDropdownChange = (value: string) => {
    if (value === '__manage__') {
      setIsSenderManagerOpen(true);
      return;
    }
    setSelectedSenderId(value);
    if (!value) {
      return;
    }
    const found = senders.find((s) => s.id === value);
    if (found) {
      applySender(found);
    }
  };

  const handleClearSenderPreset = () => {
    setSelectedSenderId('');
    setName('');
    setEmail('');
    setUserId('');
    setUserTaxId('');
  };

  const handleQuickSaveNewSender = () => {
    if (!name.trim() || !email.trim() || !userId.trim() || !userTaxId.trim()) {
      validate();
      return;
    }
    if (!onSaveSender) return;

    const newSender: SenderRecord = {
      id: `snd_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      email: email.trim(),
      userId: userId.trim(),
      userTaxId: userTaxId.trim(),
      createdAt: Date.now(),
    };
    onSaveSender(newSender);
    setSelectedSenderId(newSender.id);
    setQuickSaveMessage(`Saved "${newSender.name}" to your sender list!`);
    setTimeout(() => setQuickSaveMessage(null), 3500);
  };

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedRecord, setSubmittedRecord] = useState<ShipmentRecord | null>(null);

  // Generate unique IDs
  const generateTrackingNumber = () => {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const countryCodes = ['US', 'DE', 'GB', 'FR', 'JP', 'CA'];
    const randomCountry = countryCodes[Math.floor(Math.random() * countryCodes.length)];
    return `TRK-${code.substring(0, 4)}-${code.substring(4)}-${randomCountry}`;
  };

  const generateBoxId = () => {
    const year = new Date().getFullYear();
    const num = Math.floor(100 + Math.random() * 900);
    return `BOX-${year}-${num}`;
  };

  const handleGenerateTracking = () => {
    setTrackingNumber(generateTrackingNumber());
    if (errors.trackingNumber) {
      setErrors((prev) => ({ ...prev, trackingNumber: '' }));
    }
  };

  const handleGenerateBoxId = () => {
    setBoxId(generateBoxId());
    if (errors.boxId) {
      setErrors((prev) => ({ ...prev, boxId: '' }));
    }
  };

  const handleFillSample = () => {
    setName('Jordan Rivera');
    setEmail('j.rivera@global-logistics.net');
    setTrackingNumber(generateTrackingNumber());
    setUserId('USR-' + Math.floor(1000 + Math.random() * 9000));
    setUserTaxId('TAX-' + Math.floor(1000000 + Math.random() * 9000000));
    setCurrentDate(getTodayString());
    setLength('45');
    setWidth('32');
    setHeight('28');
    setWeight('14.5');
    setDimensionUnit('cm');
    setWeightUnit('kg');
    setShipper('FedEx Logistics');
    setBoxId(generateBoxId());
    setNotes('Precision electronic components in antistatic packaging.');
    setErrors({});
    setSubmittedRecord(null);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setTrackingNumber('');
    setUserId('');
    setUserTaxId('');
    setCurrentDate(getTodayString());
    setLength('');
    setWidth('');
    setHeight('');
    setWeight('');
    setShipper(COMMON_SHIPPERS[0]);
    setCustomShipper('');
    setBoxId('');
    setNotes('');
    setSelectedSenderId('');
    setErrors({});
    setSubmittedRecord(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!trackingNumber.trim()) newErrors.trackingNumber = 'Tracking number is required';
    if (!userId.trim()) newErrors.userId = 'User ID is required';
    if (!userTaxId.trim()) newErrors.userTaxId = 'User Tax ID is required';
    if (!currentDate) newErrors.currentDate = 'Current date is required';

    const numL = parseFloat(length);
    const numW = parseFloat(width);
    const numH = parseFloat(height);
    const numWt = parseFloat(weight);

    if (!length.trim() || isNaN(numL) || numL <= 0) newErrors.length = 'Must be > 0';
    if (!width.trim() || isNaN(numW) || numW <= 0) newErrors.width = 'Must be > 0';
    if (!height.trim() || isNaN(numH) || numH <= 0) newErrors.height = 'Must be > 0';
    if (!weight.trim() || isNaN(numWt) || numWt <= 0) newErrors.weight = 'Must be > 0';

    const finalShipper = shipper === 'Other' ? customShipper.trim() : shipper;
    if (!finalShipper) newErrors.shipper = 'Shipper is required';

    // Bulk Box ID is optional because when adding a new entry the dispatcher may not know yet which box the package will be shipped in
    if (selectedBulkBoxMode === 'custom' && customBoxId.trim() && !customShippingDate) {
      newErrors.customShippingDate = 'e-Shipping Date is required when registering a custom box';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalShipper = shipper === 'Other' ? customShipper.trim() : shipper;
    const finalBoxId = selectedBulkBoxMode === 'custom' ? customBoxId.trim() : boxId.trim();
    const matchingBulkBox = finalBoxId
      ? bulkBoxes.find((b) => b.boxId.toUpperCase() === finalBoxId.toUpperCase())
      : undefined;
    const finalShippingDate =
      matchingBulkBox?.shippingDate || (selectedBulkBoxMode === 'custom' && customBoxId.trim() ? customShippingDate : undefined);
    const finalRoute =
      matchingBulkBox?.routeRemarks ||
      (selectedBulkBoxMode === 'custom' && customBoxRoute ? customBoxRoute.trim() : undefined) ||
      (editingShipment ? editingShipment.routeRemarks : undefined);

    if (selectedBulkBoxMode === 'custom' && customBoxId.trim() && onSaveBulkBox) {
      const newBBox: BulkBoxRecord = {
        id: `bbox_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
        boxId: customBoxId.trim(),
        routeRemarks: customBoxRoute.trim() || undefined,
        shippingDate: customShippingDate,
        status: 'Open',
        createdAt: Date.now(),
        createdBy: session?.username || 'admin',
      };
      onSaveBulkBox(newBBox);
    }

    const finalRecord: ShipmentRecord = editingShipment
      ? {
          ...editingShipment,
          name: name.trim(),
          email: email.trim(),
          trackingNumber: trackingNumber.trim() || editingShipment.trackingNumber,
          userId: userId.trim(),
          userTaxId: userTaxId.trim(),
          currentDate,
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          weight: parseFloat(weight),
          dimensionUnit,
          weightUnit,
          shipper: finalShipper,
          routeRemarks: finalRoute || undefined,
          boxId: finalBoxId,
          eShippingDate: finalShippingDate,
          notes: notes.trim() || undefined,
        }
      : {
          id: `shp_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
          name: name.trim(),
          email: email.trim(),
          trackingNumber: trackingNumber.trim(),
          userId: userId.trim(),
          userTaxId: userTaxId.trim(),
          currentDate,
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          weight: parseFloat(weight),
          dimensionUnit,
          weightUnit,
          shipper: finalShipper,
          routeRemarks: finalRoute || undefined,
          boxId: finalBoxId,
          eShippingDate: finalShippingDate,
          createdAt: Date.now(),
          status: 'Received',
          notes: notes.trim() || undefined,
        };

    onFormSubmit(finalRecord);
    setSubmittedRecord(finalRecord);
  };

  // Calculations for package volume
  const numLength = parseFloat(length) || 0;
  const numWidth = parseFloat(width) || 0;
  const numHeight = parseFloat(height) || 0;
  const numWeight = parseFloat(weight) || 0;
  const volume = (numLength * numWidth * numHeight).toFixed(1);
  const dimensionalWeight =
    numLength && numWidth && numHeight
      ? (dimensionUnit === 'cm'
          ? (numLength * numWidth * numHeight) / 5000
          : (numLength * numWidth * numHeight) / 139
        ).toFixed(2)
      : '0.00';

  const selectedBoxRecord = bulkBoxes.find(
    (b) =>
      b.boxId.toUpperCase() ===
      (selectedBulkBoxMode === 'custom'
        ? customBoxId.trim().toUpperCase()
        : boxId.trim().toUpperCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="shipment-form-container">
      {/* Page Heading & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight" id="form-header-title">
              {editingShipment ? 'Edit Submitted Consignment' : 'Protected Shipment Entry Form'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {editingShipment ? 'Edit Mode' : 'Active Session'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {editingShipment
              ? `Modifying submitted form for Tracking #${editingShipment.trackingNumber}. Changes will update the record in-place.`
              : 'Enter all 12 parcel consignment parameters to record shipping documents and generate manifest data.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {editingShipment && onCancelEdit && (
            <button
              type="button"
              id="header-cancel-edit-btn"
              onClick={onCancelEdit}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Cancel Edit</span>
            </button>
          )}
          <button
            type="button"
            id="form-autofill-sample-btn"
            onClick={handleFillSample}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Auto-fill Sample</span>
          </button>
          <button
            type="button"
            id="form-reset-btn"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Edit Mode Notification Banner */}
      {editingShipment && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono text-xs font-bold rounded-lg shrink-0">
              {editingShipment.trackingNumber}
            </span>
            <div>
              <p className="text-xs font-bold text-indigo-950">Editing Existing Form Submission</p>
              <p className="text-xs text-indigo-700">
                Sender: <span className="font-semibold">{editingShipment.name}</span> • Box ID: <span className="font-semibold">{editingShipment.boxId}</span>. Saving will update this record in the registry.
              </p>
            </div>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-950 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
            >
              Exit Edit Mode
            </button>
          )}
        </div>
      )}

      {/* Submission Success Alert */}
      {submittedRecord && (
        <div
          className="mb-8 p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 shadow-xs"
          role="status"
          id="form-success-banner"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-base text-emerald-900">
                  Shipment Successfully Recorded!
                </h2>
                <p className="text-xs text-emerald-700 mt-1">
                  Parcel assigned Tracking Number <strong className="font-mono text-emerald-900">{submittedRecord.trackingNumber}</strong>
                  {submittedRecord.boxId ? (
                    <> with Box ID <strong className="font-mono text-emerald-900">{submittedRecord.boxId}</strong></>
                  ) : (
                    <> • <span className="font-semibold text-emerald-800">Box ID: Unassigned</span> (can be consolidated later)</>
                  )}
                  {submittedRecord.routeRemarks && (
                    <> via Route <strong className="text-emerald-900 font-semibold">{submittedRecord.routeRemarks}</strong></>
                  )}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="view-in-registry-btn"
                onClick={onViewList}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>View in Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="submit-another-btn"
                onClick={() => {
                  handleReset();
                  handleGenerateTracking();
                  handleGenerateBoxId();
                }}
                className="px-3.5 py-2 bg-white text-emerald-800 hover:bg-emerald-100/60 border border-emerald-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                New Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The 12-Field Form */}
      <form onSubmit={handleSubmit} className="space-y-6" id="consignment-entry-form" noValidate>
        {/* Section 1: Sender & Account Identifiers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs" id="form-section-sender">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">1. Sender & Account Information</h2>
                <p className="text-xs text-slate-500">Select from sender list to auto-populate or enter manually</p>
              </div>
            </div>

            {onNavigateToSenders && (
              <button
                type="button"
                id="btn-goto-senders-directory"
                onClick={onNavigateToSenders}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Full Directory</span>
              </button>
            )}
          </div>

          {/* Sender Drop-Down Preset Selector */}
          <div className="mb-5 p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 shadow-2xs" id="sender-preset-selector-box">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label htmlFor="sender-dropdown-select" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select from Sender List (Drop-down)</span>
                <span className="text-[11px] font-normal text-slate-500 hidden md:inline">
                  — Auto-populates Name, Email, User ID & Tax ID
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-open-sender-manager-modal"
                  onClick={() => setIsSenderManagerOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Edit List Separately</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <select
                  id="sender-dropdown-select"
                  value={selectedSenderId}
                  onChange={(e) => handleSenderDropdownChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors cursor-pointer"
                >
                  <option value="">-- Choose a sender from list to auto-fill fields --</option>
                  {senders.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.userId}) {s.company ? `• ${s.company}` : `• ${s.email}`}
                    </option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="__manage__">⚙️ Manage / Edit Sender List...</option>
                </select>
              </div>

              {selectedSenderId && (
                <button
                  type="button"
                  id="btn-clear-sender-preset"
                  onClick={handleClearSenderPreset}
                  title="Clear sender fields"
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Clear Fields
                </button>
              )}
            </div>

            {/* Visual Indicator of Auto-Population */}
            {selectedSenderId ? (
              <div className="mt-2.5 flex items-center justify-between text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>
                    Sender info auto-populated from profile. All fields remain editable below.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSenderManagerOpen(true)}
                  className="text-indigo-600 font-semibold hover:underline cursor-pointer ml-2 text-[11px] shrink-0"
                >
                  Edit profile
                </button>
              </div>
            ) : (
              name.trim() &&
              email.trim() &&
              userId.trim() &&
              userTaxId.trim() &&
              !senders.some((s) => s.userId === userId.trim()) && (
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[11px]">
                    Custom sender entered? You can add this sender to the list for future use.
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickSaveNewSender}
                    className="text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer ml-2 text-xs flex items-center gap-1 shrink-0"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save to List</span>
                  </button>
                </div>
              )
            )}

            {quickSaveMessage && (
              <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{quickSaveMessage}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Field 1: Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-name">
                Full Name / Sender <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="field-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Marcus Vance"
                  className={`w-full pl-10 pr-3 py-2 bg-white border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors ${
                    errors.name ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.name && <p className="text-xs text-rose-600 mt-1" id="error-name">{errors.name}</p>}
            </div>

            {/* Field 2: Email address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-email">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="field-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="e.g. marcus.vance@company.com"
                  className={`w-full pl-10 pr-3 py-2 bg-white border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors ${
                    errors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-600 mt-1" id="error-email">{errors.email}</p>}
            </div>

            {/* Field 4: User ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-user-id">
                User ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  id="field-user-id"
                  type="text"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    if (errors.userId) setErrors((prev) => ({ ...prev, userId: '' }));
                  }}
                  placeholder="e.g. USR-9402"
                  className={`w-full pl-10 pr-3 py-2 bg-white border rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors ${
                    errors.userId ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.userId && <p className="text-xs text-rose-600 mt-1" id="error-user-id">{errors.userId}</p>}
            </div>

            {/* Field 5: User Tax ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-user-tax-id">
                User Tax ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  id="field-user-tax-id"
                  type="text"
                  value={userTaxId}
                  onChange={(e) => {
                    setUserTaxId(e.target.value);
                    if (errors.userTaxId) setErrors((prev) => ({ ...prev, userTaxId: '' }));
                  }}
                  placeholder="e.g. TAX-8492019"
                  className={`w-full pl-10 pr-3 py-2 bg-white border rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors ${
                    errors.userTaxId ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.userTaxId && <p className="text-xs text-rose-600 mt-1" id="error-user-tax-id">{errors.userTaxId}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Logistics & Identifiers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs" id="form-section-logistics">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">2. Shipment & Waybill Identifiers</h2>
              <p className="text-xs text-slate-500">Carrier selection, tracking reference, and container box</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Field 3: Tracking Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="field-tracking-number">
                  Tracking Number <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  id="generate-tracking-btn"
                  onClick={handleGenerateTracking}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  + Generate
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  id="field-tracking-number"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => {
                    setTrackingNumber(e.target.value);
                    if (errors.trackingNumber) setErrors((prev) => ({ ...prev, trackingNumber: '' }));
                  }}
                  placeholder="e.g. TRK-4821-X9"
                  className={`w-full pl-10 pr-3 py-2 bg-white border rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors ${
                    errors.trackingNumber ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.trackingNumber && <p className="text-xs text-rose-600 mt-1" id="error-tracking">{errors.trackingNumber}</p>}
            </div>

            {/* Field 12: Bulk Box ID (with e-Shipping Date) */}
            <div id="field-box-id-container">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="field-box-id-select">
                    Bulk Box ID <span className="text-slate-400 font-normal text-[11px] normal-case tracking-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    Admin Created
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-open-bulk-box-manager"
                    onClick={() => {
                      if (onNavigateToBulkBoxes) {
                        onNavigateToBulkBoxes();
                      } else {
                        setIsBulkBoxManagerOpen(true);
                      }
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Manage Bulk Boxes</span>
                  </button>
                </div>
              </div>

              {selectedBulkBoxMode === 'existing' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Box className="w-4 h-4" />
                    </div>
                    <select
                      id="field-box-id-select"
                      value={boxId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__REGISTER_CUSTOM__') {
                          setSelectedBulkBoxMode('custom');
                          setCustomBoxId('');
                          return;
                        }
                        if (val === '__MANAGE_BULK_BOXES__') {
                          if (onNavigateToBulkBoxes) {
                            onNavigateToBulkBoxes();
                          } else {
                            setIsBulkBoxManagerOpen(true);
                          }
                          return;
                        }
                        setBoxId(val);
                        if (errors.boxId) setErrors((prev) => ({ ...prev, boxId: '' }));
                      }}
                      className={`w-full pl-10 pr-9 py-2 bg-white border rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors cursor-pointer ${
                        errors.boxId ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="" className="font-sans text-slate-500">
                        -- Not Assigned Yet (Leave Blank / Assign Later) --
                      </option>
                      <optgroup label="Registered Bulk Boxes (with Attached Routes)">
                        {bulkBoxes.map((b) => (
                          <option key={b.id} value={b.boxId}>
                            {b.boxId} • {b.routeRemarks ? `Route: ${b.routeRemarks}` : 'General Route'} • e-Ship: {b.shippingDate} ({b.status || 'Open'})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Options">
                        <option value="__REGISTER_CUSTOM__">+ Register Custom Bulk Box ID...</option>
                        <option value="__MANAGE_BULK_BOXES__">⚙️ Open Bulk Box ID Registry...</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Highlight card for selected Bulk Box, its attached Route, and e-Shipping Date */}
                  {selectedBoxRecord ? (
                    <div
                      id="selected-bulk-box-info"
                      className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col gap-2.5 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Box className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900">{selectedBoxRecord.boxId}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-950 font-semibold shadow-2xs">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            <span>e-Shipping Date:</span>
                            <strong className="font-mono text-indigo-700">{selectedBoxRecord.shippingDate}</strong>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {selectedBoxRecord.status || 'Open'}
                          </span>
                        </div>
                      </div>

                      {/* Consolidation Route link callout */}
                      <div className="pt-2 border-t border-indigo-100/90 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-indigo-950 font-medium">
                          <Navigation className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>
                            Attached Route / Remark: <strong className="font-bold text-indigo-900">{selectedBoxRecord.routeRemarks || 'General Route'}</strong>
                          </span>
                        </div>
                        <span className="text-slate-500 text-[10px] italic">
                          (Small package will be consolidated in this bulk box and dispatched via this route)
                        </span>
                      </div>
                    </div>
                  ) : boxId ? (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 pl-1">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>Selected Box ID: <strong className="font-mono text-slate-700">{boxId}</strong></span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs flex items-center gap-2">
                      <Info className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        <strong className="text-slate-700">No Bulk Box assigned yet.</strong> Package container can be left unassigned upon new entry and consolidated into a bulk box later from the Registry.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Custom Bulk Box entry mode */
                <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200" id="custom-bulk-box-entry">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700" htmlFor="field-custom-box-id">
                          New Bulk Box ID
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const year = new Date().getFullYear();
                            const num = Math.floor(100 + Math.random() * 900);
                            setCustomBoxId(`BOX-${year}-${num}`);
                            if (errors.boxId) setErrors((prev) => ({ ...prev, boxId: '' }));
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          + Auto Gen
                        </button>
                      </div>
                      <input
                        id="field-custom-box-id"
                        type="text"
                        value={customBoxId}
                        onChange={(e) => {
                          setCustomBoxId(e.target.value);
                          if (errors.boxId) setErrors((prev) => ({ ...prev, boxId: '' }));
                        }}
                        placeholder="e.g. BOX-2026-095"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1" htmlFor="field-custom-box-route">
                        Attached Route / Remark
                      </label>
                      <select
                        id="field-custom-box-route"
                        value={customBoxRoute}
                        onChange={(e) => setCustomBoxRoute(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      >
                        {routes.length > 0
                          ? routes.map((r) => (
                              <option key={r.id} value={r.name}>
                                {r.name}
                              </option>
                            ))
                          : COMMON_ROUTES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1" htmlFor="field-custom-box-date">
                        e-Shipping Date
                      </label>
                      <input
                        id="field-custom-box-date"
                        type="date"
                        value={customShippingDate}
                        onChange={(e) => {
                          setCustomShippingDate(e.target.value);
                          if (errors.customShippingDate) setErrors((prev) => ({ ...prev, customShippingDate: '' }));
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBulkBoxMode('existing');
                        setCustomBoxId('');
                      }}
                      className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      ← Back to registered Bulk Boxes
                    </button>

                    {customBoxId.trim() && onSaveBulkBox && (
                      <button
                        type="button"
                        id="btn-save-custom-bulk-box-quick"
                        onClick={() => {
                          const newBBox: BulkBoxRecord = {
                            id: `bbox_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
                            boxId: customBoxId.trim(),
                            routeRemarks: customBoxRoute.trim() || undefined,
                            shippingDate: customShippingDate,
                            status: 'Open',
                            createdAt: Date.now(),
                            createdBy: session?.username || 'admin',
                          };
                          onSaveBulkBox(newBBox);
                          setBoxId(newBBox.boxId);
                          setSelectedBulkBoxMode('existing');
                          setQuickBulkBoxSaveMessage(`Bulk Box "${newBBox.boxId}" registered with Route "${newBBox.routeRemarks || 'General'}" & e-Shipping Date ${newBBox.shippingDate}!`);
                          setTimeout(() => setQuickBulkBoxSaveMessage(null), 4000);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Save &amp; Register</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {quickBulkBoxSaveMessage && (
                <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{quickBulkBoxSaveMessage}</span>
                </div>
              )}

              {errors.boxId && <p className="text-xs text-rose-600 mt-1" id="error-box-id">{errors.boxId}</p>}
              {errors.customShippingDate && (
                <p className="text-xs text-rose-600 mt-1" id="error-custom-box-date">{errors.customShippingDate}</p>
              )}
            </div>

            {/* Field 11: Shipper */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="field-shipper">
                  Shipper / Carrier <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-edit-carriers-list"
                    onClick={() => setIsCarrierManagerOpen(true)}
                    title="Edit Shipper list"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Edit Shipper List</span>
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Truck className="w-4 h-4" />
                </div>
                <select
                  id="field-shipper"
                  value={shipper}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__MANAGE_CARRIERS__') {
                      setIsCarrierManagerOpen(true);
                      return;
                    }
                    setShipper(val);
                    if (errors.shipper) setErrors((prev) => ({ ...prev, shipper: '' }));
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                >
                  <optgroup label="Shippers & Carriers">
                    {carriers.length > 0
                      ? carriers.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))
                      : COMMON_SHIPPERS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                  </optgroup>
                  <optgroup label="Options">
                    <option value="Other">Other / Custom Shipper...</option>
                    <option value="__MANAGE_CARRIERS__">⚙️ Edit Shipper List...</option>
                  </optgroup>
                </select>
              </div>
              {shipper === 'Other' && (
                <div className="mt-2 space-y-1.5">
                  <input
                    id="field-custom-shipper"
                    type="text"
                    value={customShipper}
                    onChange={(e) => {
                      setCustomShipper(e.target.value);
                      if (errors.shipper) setErrors((prev) => ({ ...prev, shipper: '' }));
                    }}
                    placeholder="Specify carrier name (e.g. Polar Express)"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  {customShipper.trim() && onSaveCarrier && (
                    <button
                      type="button"
                      id="btn-save-custom-carrier-quick"
                      onClick={() => {
                        const newCarrier: CarrierRecord = {
                          id: `car_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
                          name: customShipper.trim(),
                          createdAt: Date.now(),
                        };
                        onSaveCarrier(newCarrier);
                        setShipper(newCarrier.name);
                        setCustomShipper('');
                        setQuickCarrierSaveMessage(`Carrier "${newCarrier.name}" saved to separate list!`);
                        setTimeout(() => setQuickCarrierSaveMessage(null), 3500);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Save "{customShipper.trim()}" to Carrier Directory</span>
                    </button>
                  )}
                </div>
              )}

              {quickCarrierSaveMessage && (
                <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{quickCarrierSaveMessage}</span>
                </div>
              )}

              {errors.shipper && <p className="text-xs text-rose-600 mt-1" id="error-shipper">{errors.shipper}</p>}
            </div>

            {/* Field: Current Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-current-date">
                Current Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="field-current-date"
                  type="date"
                  value={currentDate}
                  onChange={(e) => {
                    setCurrentDate(e.target.value);
                    if (errors.currentDate) setErrors((prev) => ({ ...prev, currentDate: '' }));
                  }}
                  className={`w-full pl-10 pr-3 py-2 bg-white border rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors ${
                    errors.currentDate ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.currentDate && <p className="text-xs text-rose-600 mt-1" id="error-current-date">{errors.currentDate}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Package Dimensions & Weight */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs" id="form-section-dimensions">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Maximize2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">3. Physical Dimensions & Weight</h2>
                <p className="text-xs text-slate-500">Volumetric specifications and tare weight calculation</p>
              </div>
            </div>

            {/* Unit Selectors */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5" id="unit-dimension-toggle">
                <button
                  type="button"
                  id="unit-dim-cm-btn"
                  onClick={() => setDimensionUnit('cm')}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    dimensionUnit === 'cm' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  id="unit-dim-in-btn"
                  onClick={() => setDimensionUnit('in')}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    dimensionUnit === 'in' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  in
                </button>
              </div>

              <div className="flex items-center bg-slate-100 rounded-lg p-0.5" id="unit-weight-toggle">
                <button
                  type="button"
                  id="unit-wt-kg-btn"
                  onClick={() => setWeightUnit('kg')}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    weightUnit === 'kg' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  id="unit-wt-lbs-btn"
                  onClick={() => setWeightUnit('lbs')}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    weightUnit === 'lbs' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  lbs
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Field 7: Length */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-length">
                Length ({dimensionUnit}) <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-length"
                type="number"
                step="0.1"
                min="0.1"
                value={length}
                onChange={(e) => {
                  setLength(e.target.value);
                  if (errors.length) setErrors((prev) => ({ ...prev, length: '' }));
                }}
                placeholder="e.g. 45"
                className={`w-full px-3.5 py-2 bg-white border rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                  errors.length ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                }`}
              />
              {errors.length && <p className="text-xs text-rose-600 mt-1" id="error-length">{errors.length}</p>}
            </div>

            {/* Field 8: Width */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-width">
                Width ({dimensionUnit}) <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-width"
                type="number"
                step="0.1"
                min="0.1"
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  if (errors.width) setErrors((prev) => ({ ...prev, width: '' }));
                }}
                placeholder="e.g. 30"
                className={`w-full px-3.5 py-2 bg-white border rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                  errors.width ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                }`}
              />
              {errors.width && <p className="text-xs text-rose-600 mt-1" id="error-width">{errors.width}</p>}
            </div>

            {/* Field 9: Height */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-height">
                Height ({dimensionUnit}) <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-height"
                type="number"
                step="0.1"
                min="0.1"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  if (errors.height) setErrors((prev) => ({ ...prev, height: '' }));
                }}
                placeholder="e.g. 25"
                className={`w-full px-3.5 py-2 bg-white border rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                  errors.height ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                }`}
              />
              {errors.height && <p className="text-xs text-rose-600 mt-1" id="error-height">{errors.height}</p>}
            </div>

            {/* Field 10: Weight */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-weight">
                Weight ({weightUnit}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="field-weight"
                  type="number"
                  step="0.05"
                  min="0.05"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    if (errors.weight) setErrors((prev) => ({ ...prev, weight: '' }));
                  }}
                  placeholder="e.g. 12.4"
                  className={`w-full px-3.5 py-2 bg-white border rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                    errors.weight ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.weight && <p className="text-xs text-rose-600 mt-1" id="error-weight">{errors.weight}</p>}
            </div>
          </div>

          {/* Metric Calculation Card */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4" id="volume-calc-strip">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                Computed Volume: <strong className="text-slate-900 font-mono">{volume} {dimensionUnit}³</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Scale className="w-4 h-4 text-slate-400" />
              <span>
                Est. Volumetric Weight: <strong className="text-slate-900 font-mono">{dimensionalWeight} {weightUnit}</strong>
              </span>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="mt-5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-notes">
              Consignment Handling Notes / Manifest Remarks (Optional)
            </label>
            <textarea
              id="field-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Temperature sensitive, fragile glass, customs tariff classification code..."
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2" id="form-submit-actions">
          {editingShipment && onCancelEdit && (
            <button
              type="button"
              id="form-cancel-edit-btn"
              onClick={onCancelEdit}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="button"
            id="form-cancel-btn"
            onClick={onViewList}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel & View List
          </button>
          <button
            type="submit"
            id="form-submit-btn"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>{editingShipment ? 'Save Changes & Update' : 'Submit Consignment Form'}</span>
          </button>
        </div>
      </form>

      {/* Senders Management Modal (Accessible directly from dropdown) */}
      {isSenderManagerOpen && onSaveSender && onDeleteSender && onResetSenders && (
        <SendersManager
          senders={senders}
          onSaveSender={(sender) => {
            onSaveSender(sender);
            applySender(sender);
          }}
          onDeleteSender={(id) => {
            onDeleteSender(id);
            if (selectedSenderId === id) {
              setSelectedSenderId('');
            }
          }}
          onResetSenders={onResetSenders}
          onSelectSenderForForm={(sender) => {
            applySender(sender);
            setIsSenderManagerOpen(false);
          }}
          isModal={true}
          onClose={() => setIsSenderManagerOpen(false)}
        />
      )}

      {/* Shippers / Carriers Management Modal (Accessible directly from dropdown or button) */}
      {isCarrierManagerOpen && onSaveCarrier && onDeleteCarrier && onResetCarriers && (
        <CarriersManager
          carriers={carriers}
          onSaveCarrier={(savedCarrier) => {
            onSaveCarrier(savedCarrier);
            setShipper(savedCarrier.name);
          }}
          onDeleteCarrier={(id) => {
            onDeleteCarrier(id);
            const deleted = carriers.find((c) => c.id === id);
            if (deleted && shipper === deleted.name) {
              const remaining = carriers.filter((c) => c.id !== id);
              setShipper(remaining[0]?.name || COMMON_SHIPPERS[0]);
            }
          }}
          onResetCarriers={onResetCarriers}
          onSelectCarrierForForm={(carrierName) => {
            setShipper(carrierName);
            setIsCarrierManagerOpen(false);
          }}
          isModal={true}
          onClose={() => setIsCarrierManagerOpen(false)}
        />
      )}

      {/* Bulk Box Management Modal (Accessible directly from dropdown or button) */}
      {isBulkBoxManagerOpen && onSaveBulkBox && onDeleteBulkBox && onResetBulkBoxes && (
        <BulkBoxManager
          bulkBoxes={bulkBoxes}
          shipments={[]}
          session={session}
          onSaveBulkBox={(savedBox) => {
            onSaveBulkBox(savedBox);
            setBoxId(savedBox.boxId);
            setSelectedBulkBoxMode('existing');
          }}
          onDeleteBulkBox={(id) => {
            onDeleteBulkBox(id);
            const deleted = bulkBoxes.find((b) => b.id === id);
            if (deleted && boxId === deleted.boxId) {
              setBoxId('');
            }
          }}
          onResetBulkBoxes={onResetBulkBoxes}
          onSelectForShipment={(selectedBox) => {
            setBoxId(selectedBox.boxId);
            setSelectedBulkBoxMode('existing');
            setIsBulkBoxManagerOpen(false);
          }}
          isModal={true}
          onCloseModal={() => setIsBulkBoxManagerOpen(false)}
        />
      )}
    </div>
  );
};
