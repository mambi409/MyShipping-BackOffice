import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Package,
  Calendar,
  Mail,
  User,
  Hash,
  CreditCard,
  Truck,
  Box,
  Scale,
  Maximize2,
  FileText,
  Navigation,
  Pencil,
} from 'lucide-react';
import { ShipmentRecord } from '../types';

interface ShipmentDetailModalProps {
  shipment: ShipmentRecord | null;
  onClose: () => void;
  onEdit?: (shipment: ShipmentRecord) => void;
}

export const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({ shipment, onClose, onEdit }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!shipment) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handlePrint = () => {
    window.print();
  };

  const volume = (shipment.length * shipment.width * shipment.height).toFixed(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      id="shipment-detail-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        id="shipment-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900" id="detail-modal-title">
                  Consignment Waybill Record
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                  {shipment.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {shipment.trackingNumber} {shipment.boxId ? `• ${shipment.boxId}` : '• Unassigned Box'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                id="detail-edit-top-btn"
                onClick={() => {
                  onEdit(shipment);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Edit this submitted form"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Form</span>
              </button>
            )}
            <button
              type="button"
              id="detail-print-btn"
              onClick={handlePrint}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Print Manifest"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="detail-close-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6" id="shipment-detail-content">
          {/* Tracking Highlight Banner */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-indigo-700">
                Primary Tracking Number
              </div>
              <div className="text-xl font-mono font-bold text-indigo-950 mt-0.5">
                {shipment.trackingNumber}
              </div>
            </div>
            <button
              type="button"
              id="copy-tracking-num-btn"
              onClick={() => handleCopy(shipment.trackingNumber, 'tracking')}
              className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedField === 'tracking' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Number</span>
                </>
              )}
            </button>
          </div>

          {/* Grid of all 12 Required Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* 1. Name */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">1. Sender Name</span>
              </div>
              <div className="text-sm font-semibold text-slate-900">{shipment.name}</div>
            </div>

            {/* 2. Email Address */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">2. Email Address</span>
              </div>
              <div className="text-sm font-semibold text-slate-900 break-all">{shipment.email}</div>
            </div>

            {/* 3. Tracking Number */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">3. Tracking Number</span>
              </div>
              <div className="text-sm font-mono font-bold text-slate-900">{shipment.trackingNumber}</div>
            </div>

            {/* 4. User ID */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">4. User ID</span>
              </div>
              <div className="text-sm font-mono font-semibold text-slate-900">{shipment.userId}</div>
            </div>

            {/* 5. User Tax ID */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">5. User Tax ID</span>
              </div>
              <div className="text-sm font-mono font-semibold text-slate-900">{shipment.userTaxId}</div>
            </div>

            {/* 6. Current Date */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">6. Date Registered</span>
              </div>
              <div className="text-sm font-semibold text-slate-900">{shipment.currentDate}</div>
            </div>

            {/* 7, 8, 9. Dimensions: Length, Width, Height */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    7, 8, 9. Dimensions (Length × Width × Height)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Total Vol: {volume} {shipment.dimensionUnit}³
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Length</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {shipment.length} {shipment.dimensionUnit}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Width</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {shipment.width} {shipment.dimensionUnit}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Height</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {shipment.height} {shipment.dimensionUnit}
                  </div>
                </div>
              </div>
            </div>

            {/* 10. Weight */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">10. Weight</span>
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">
                {shipment.weight} {shipment.weightUnit}
              </div>
            </div>

            {/* 11. Shipper */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">11. Shipper / Carrier</span>
              </div>
              <div className="text-sm font-bold text-indigo-700">{shipment.shipper}</div>
            </div>

            {/* Route / Remarks */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Navigation className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Route / Remarks</span>
              </div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                {shipment.routeRemarks ? (
                  <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-800 text-xs font-semibold">
                    {shipment.routeRemarks}
                  </span>
                ) : (
                  <span className="text-slate-400 italic font-normal text-xs">Standard Route</span>
                )}
              </div>
            </div>

            {/* 12. Box ID & e-Shipping Date */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Box className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold uppercase tracking-wider text-[10px]">12. Bulk Box Identifier</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-900">
                    {shipment.boxId || (
                      <span className="text-slate-400 font-sans font-normal italic text-xs">
                        Unassigned (Pending Bulk Box Selection)
                      </span>
                    )}
                  </div>
                </div>

                {shipment.eShippingDate && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-slate-600">e-Shipping Date:</span>
                    <strong className="font-mono text-indigo-800">{shipment.eShippingDate}</strong>
                  </div>
                )}

                {shipment.boxId ? (
                  <button
                    type="button"
                    id="copy-box-id-btn"
                    onClick={() => handleCopy(shipment.boxId, 'box')}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'box' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'box' ? 'Copied' : 'Copy'}</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Notes if available */}
          {shipment.notes && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Handling Notes</span>
              </div>
              <p className="text-slate-700">{shipment.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Internal Manifest ID: <code className="font-mono text-slate-700">{shipment.id}</code>
          </span>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                id="edit-waybill-btn"
                onClick={() => {
                  onEdit(shipment);
                  onClose();
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Form</span>
              </button>
            )}
            <button
              type="button"
              id="close-modal-bottom-btn"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close Waybill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
