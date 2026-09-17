import React from 'react';
import { Package, PlusCircle, ListFilter, LogOut, UserCheck, Users, Truck, Box, Navigation } from 'lucide-react';
import { AuthSession } from '../types';

interface NavbarProps {
  session: AuthSession;
  activeTab: 'form' | 'list' | 'senders' | 'carriers' | 'bulk-boxes' | 'routes';
  onSelectTab: (tab: 'form' | 'list' | 'senders' | 'carriers' | 'bulk-boxes' | 'routes') => void;
  onLogout: () => void;
  submissionCount: number;
  sendersCount: number;
  carriersCount: number;
  bulkBoxesCount: number;
  routesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  activeTab,
  onSelectTab,
  onLogout,
  submissionCount,
  sendersCount,
  carriersCount,
  bulkBoxesCount,
  routesCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="app-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3" id="navbar-brand">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  Shipment Registry
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Protected
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Parcel Entry, Manifest & Waybill Tracking
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1" id="navbar-nav-tabs">
            <button
              type="button"
              id="nav-tab-form-btn"
              onClick={() => onSelectTab('form')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === 'form'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Entry Form</span>
            </button>

            <button
              type="button"
              id="nav-tab-senders-btn"
              onClick={() => onSelectTab('senders')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer relative shrink-0 ${
                activeTab === 'senders'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Sender List</span>
              <span
                id="navbar-senders-count-badge"
                className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'senders'
                    ? 'bg-indigo-700/80 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {sendersCount}
              </span>
            </button>

            <button
              type="button"
              id="nav-tab-carriers-btn"
              onClick={() => onSelectTab('carriers')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer relative shrink-0 ${
                activeTab === 'carriers'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Shipper List</span>
              <span
                id="navbar-carriers-count-badge"
                className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'carriers'
                    ? 'bg-indigo-700/80 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {carriersCount}
              </span>
            </button>

            <button
              type="button"
              id="nav-tab-bulk-boxes-btn"
              onClick={() => onSelectTab('bulk-boxes')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer relative shrink-0 ${
                activeTab === 'bulk-boxes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Bulk Box ID</span>
              <span
                id="navbar-bulk-boxes-count-badge"
                className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'bulk-boxes'
                    ? 'bg-indigo-700/80 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {bulkBoxesCount}
              </span>
            </button>

            <button
              type="button"
              id="nav-tab-routes-btn"
              onClick={() => onSelectTab('routes')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer relative shrink-0 ${
                activeTab === 'routes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>Route / Remarks</span>
              <span
                id="navbar-routes-count-badge"
                className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'routes'
                    ? 'bg-indigo-700/80 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {routesCount}
              </span>
            </button>

            <button
              type="button"
              id="nav-tab-list-btn"
              onClick={() => onSelectTab('list')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer relative shrink-0 ${
                activeTab === 'list'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Submitted Forms</span>
              <span
                id="navbar-submission-count-badge"
                className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'list'
                    ? 'bg-indigo-700/80 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {submissionCount}
              </span>
            </button>
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3" id="navbar-user-section">
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs">
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-800 leading-tight">
                  {session.username}
                </div>
                <div className="text-[10px] text-slate-500">{session.role}</div>
              </div>
            </div>

            <button
              type="button"
              id="navbar-logout-btn"
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
