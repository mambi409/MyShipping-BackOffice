import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Mail,
  Hash,
  CreditCard,
  Building2,
  Phone,
  RotateCcw,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { SenderRecord } from '../types';

interface SendersManagerProps {
  senders: SenderRecord[];
  onSaveSender: (sender: SenderRecord) => void;
  onDeleteSender: (id: string) => void;
  onResetSenders: () => void;
  onSelectSenderForForm?: (sender: SenderRecord) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const SendersManager: React.FC<SendersManagerProps> = ({
  senders,
  onSaveSender,
  onDeleteSender,
  onResetSenders,
  onSelectSenderForForm,
  isModal = false,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSender, setEditingSender] = useState<SenderRecord | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields for Add/Edit
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    userId: string;
    userTaxId: string;
    company: string;
    phone: string;
    notes: string;
  }>({
    name: '',
    email: '',
    userId: '',
    userTaxId: '',
    company: '',
    phone: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const generateUserId = () => {
    return 'USR-' + Math.floor(1000 + Math.random() * 9000);
  };

  const generateTaxId = () => {
    const prefixes = ['US', 'DE', 'FR', 'JP', 'GB', 'CA'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100000000 + Math.random() * 900000000);
    return `${prefix}-${num}`;
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      userId: generateUserId(),
      userTaxId: generateTaxId(),
      company: '',
      phone: '',
      notes: '',
    });
    setFormErrors({});
    setEditingSender(null);
    setIsAddingNew(true);
  };

  const handleOpenEdit = (sender: SenderRecord) => {
    setFormData({
      name: sender.name,
      email: sender.email,
      userId: sender.userId,
      userTaxId: sender.userTaxId,
      company: sender.company || '',
      phone: sender.phone || '',
      notes: sender.notes || '',
    });
    setFormErrors({});
    setIsAddingNew(false);
    setEditingSender(sender);
  };

  const handleCloseForm = () => {
    setIsAddingNew(false);
    setEditingSender(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.userId.trim()) errors.userId = 'User ID is required';
    if (!formData.userTaxId.trim()) errors.userTaxId = 'User Tax ID is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const record: SenderRecord = {
      id: editingSender ? editingSender.id : `snd_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      userId: formData.userId.trim(),
      userTaxId: formData.userTaxId.trim(),
      company: formData.company.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      createdAt: editingSender ? editingSender.createdAt : Date.now(),
    };

    onSaveSender(record);
    handleCloseForm();
  };

  const handleDelete = (id: string) => {
    onDeleteSender(id);
    setDeleteConfirmId(null);
  };

  // Filtered senders
  const filteredSenders = senders.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.userId.toLowerCase().includes(q) ||
      s.userTaxId.toLowerCase().includes(q) ||
      (s.company && s.company.toLowerCase().includes(q)) ||
      (s.notes && s.notes.toLowerCase().includes(q))
    );
  });

  const content = (
    <div className="space-y-6" id="sender-manager-content">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight" id="sender-manager-title">
              Sender Directory & Preset List
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {senders.length} {senders.length === 1 ? 'sender' : 'senders'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage authorized senders for the shipment drop-down. Added or edited profiles auto-populate into new consignment forms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-add-new-sender"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Sender</span>
          </button>

          <button
            type="button"
            id="btn-reset-default-senders"
            onClick={() => {
              if (window.confirm('Reset sender list back to default presets? Custom senders will be replaced.')) {
                onResetSenders();
              }
            }}
            title="Reset to default preset senders"
            className="p-2 rounded-xl text-xs font-semibold text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer ml-1"
              aria-label="Close sender directory"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          id="sender-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search senders by name, email, user ID, tax ID, or company..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Add / Edit Inline Modal/Drawer */}
      {(isAddingNew || editingSender) && (
        <div
          className="p-5 rounded-2xl bg-indigo-50/50 border-2 border-indigo-200 shadow-xs transition-all"
          id="sender-editor-panel"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {isAddingNew ? 'Create New Sender Profile' : `Edit Sender Profile: ${editingSender?.name}`}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4" id="sender-form" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" htmlFor="sender-input-name">
                  Full Name / Sender <span className="text-rose-500">*</span>
                </label>
                <input
                  id="sender-input-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Jordan Rivera"
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                    formErrors.name ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" htmlFor="sender-input-email">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="sender-input-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, email: e.target.value }));
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="e.g. j.rivera@logistics.net"
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                    formErrors.email ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.email && <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>}
              </div>

              {/* User ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="sender-input-userid">
                    User ID <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, userId: generateUserId() }))}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    + Generate
                  </button>
                </div>
                <input
                  id="sender-input-userid"
                  type="text"
                  value={formData.userId}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, userId: e.target.value }));
                    if (formErrors.userId) setFormErrors((prev) => ({ ...prev, userId: '' }));
                  }}
                  placeholder="e.g. USR-4920"
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                    formErrors.userId ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.userId && <p className="text-xs text-rose-600 mt-1">{formErrors.userId}</p>}
              </div>

              {/* User Tax ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="sender-input-taxid">
                    User Tax ID <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, userTaxId: generateTaxId() }))}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    + Generate
                  </button>
                </div>
                <input
                  id="sender-input-taxid"
                  type="text"
                  value={formData.userTaxId}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, userTaxId: e.target.value }));
                    if (formErrors.userTaxId) setFormErrors((prev) => ({ ...prev, userTaxId: '' }));
                  }}
                  placeholder="e.g. US-849201938"
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                    formErrors.userTaxId ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.userTaxId && <p className="text-xs text-rose-600 mt-1">{formErrors.userTaxId}</p>}
              </div>

              {/* Company / Organization */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" htmlFor="sender-input-company">
                  Company / Organization <span className="text-slate-400 text-[10px] lowercase">(optional)</span>
                </label>
                <input
                  id="sender-input-company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g. Acme Precision Labs"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Phone / Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" htmlFor="sender-input-phone">
                  Phone Number <span className="text-slate-400 text-[10px] lowercase">(optional)</span>
                </label>
                <input
                  id="sender-input-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +1 (555) 019-2831"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" htmlFor="sender-input-notes">
                Account Notes & Instructions <span className="text-slate-400 text-[10px] lowercase">(optional)</span>
              </label>
              <textarea
                id="sender-input-notes"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Special instructions, handling guidelines, department tags..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-sender"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingSender ? 'Save Changes' : 'Create Sender'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Senders Cards / List */}
      {filteredSenders.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200" id="sender-empty-state">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No senders match your search</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or add a new sender to your directory.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Sender</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="senders-grid">
          {filteredSenders.map((sender) => {
            const isDeleting = deleteConfirmId === sender.id;
            return (
              <div
                key={sender.id}
                id={`sender-card-${sender.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center border border-indigo-100 shrink-0">
                        {sender.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {sender.name}
                        </h4>
                        {sender.company && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{sender.company}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        id={`btn-edit-sender-${sender.id}`}
                        onClick={() => handleOpenEdit(sender)}
                        title="Edit sender details"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        id={`btn-delete-sender-${sender.id}`}
                        onClick={() => setDeleteConfirmId(sender.id)}
                        title="Delete sender"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Identification tags */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] font-semibold text-slate-800">
                        {sender.userId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] text-slate-800">
                        {sender.userTaxId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 truncate">{sender.email}</span>
                    </div>

                    {sender.phone && (
                      <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700 text-[11px] font-mono">{sender.phone}</span>
                      </div>
                    )}

                    {sender.notes && (
                      <div className="col-span-2 mt-1 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100">
                        {sender.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Confirmation or Use in Form CTA */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  {isDeleting ? (
                    <div className="flex items-center justify-between p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <span className="font-medium">Delete this sender?</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(sender.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    onSelectSenderForForm && (
                      <button
                        type="button"
                        id={`btn-use-sender-${sender.id}`}
                        onClick={() => onSelectSenderForForm(sender)}
                        className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Use in Consignment Entry Form</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        id="sender-manager-modal"
      >
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" id="sender-manager-page">
      {content}
    </div>
  );
};
