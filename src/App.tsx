import React, { useState, useEffect } from 'react';
import { AuthSession, ShipmentRecord, SenderRecord, CarrierRecord, BulkBoxRecord, RouteRecord } from './types';
import {
  getStoredShipments,
  saveShipment,
  deleteShipment,
  resetShipments,
  getStoredSenders,
  saveSender,
  deleteSender,
  resetSenders,
  getStoredCarriers,
  saveCarrier,
  deleteCarrier,
  resetCarriers,
  getStoredBulkBoxes,
  saveBulkBox,
  deleteBulkBox,
  resetBulkBoxes,
  getStoredRoutes,
  saveRoute,
  deleteRoute,
  resetRoutes,
  getStoredAuth,
  saveStoredAuth,
} from './utils/storage';
import { LoginForm } from './components/LoginForm';
import { Navbar } from './components/Navbar';
import { ShipmentForm } from './components/ShipmentForm';
import { ShipmentList } from './components/ShipmentList';
import { ShipmentDetailModal } from './components/ShipmentDetailModal';
import { SendersManager } from './components/SendersManager';
import { CarriersManager } from './components/CarriersManager';
import { BulkBoxManager } from './components/BulkBoxManager';
import { RoutesManager } from './components/RoutesManager';

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [senders, setSenders] = useState<SenderRecord[]>([]);
  const [carriers, setCarriers] = useState<CarrierRecord[]>([]);
  const [bulkBoxes, setBulkBoxes] = useState<BulkBoxRecord[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'form' | 'list' | 'senders' | 'carriers' | 'bulk-boxes' | 'routes'>('form');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [editingShipment, setEditingShipment] = useState<ShipmentRecord | null>(null);
  const [preselectedSender, setPreselectedSender] = useState<SenderRecord | null>(null);
  const [preselectedCarrier, setPreselectedCarrier] = useState<string | null>(null);
  const [preselectedBulkBox, setPreselectedBulkBox] = useState<BulkBoxRecord | null>(null);
  const [preselectedRoute, setPreselectedRoute] = useState<string | null>(null);

  // Initialize data on client
  useEffect(() => {
    const savedAuth = getStoredAuth();
    if (savedAuth && savedAuth.isAuthenticated) {
      setAuthSession(savedAuth);
    }
    setIsAuthLoaded(true);

    const savedShipments = getStoredShipments();
    setShipments(savedShipments);

    const savedSenders = getStoredSenders();
    setSenders(savedSenders);

    const savedCarriers = getStoredCarriers();
    setCarriers(savedCarriers);

    const savedBulkBoxes = getStoredBulkBoxes();
    setBulkBoxes(savedBulkBoxes);

    const savedRoutes = getStoredRoutes();
    setRoutes(savedRoutes);
  }, []);

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    saveStoredAuth(session);
  };

  const handleLogout = () => {
    setAuthSession(null);
    saveStoredAuth(null);
  };

  const handleFormSubmit = (record: ShipmentRecord) => {
    const updated = saveShipment(record);
    setShipments(updated);
    if (editingShipment) {
      setEditingShipment(null);
    }
  };

  const handleDeleteShipment = (id: string) => {
    const updated = deleteShipment(id);
    setShipments(updated);
    if (selectedShipment && selectedShipment.id === id) {
      setSelectedShipment(null);
    }
  };

  const handleResetData = () => {
    const updated = resetShipments();
    setShipments(updated);
  };

  const handleSaveSender = (sender: SenderRecord) => {
    const updated = saveSender(sender);
    setSenders(updated);
  };

  const handleDeleteSender = (id: string) => {
    const updated = deleteSender(id);
    setSenders(updated);
  };

  const handleResetSenders = () => {
    const updated = resetSenders();
    setSenders(updated);
  };

  const handleSelectSenderForForm = (sender: SenderRecord) => {
    setPreselectedSender(sender);
    setActiveTab('form');
  };

  const handleSaveCarrier = (carrier: CarrierRecord) => {
    const updated = saveCarrier(carrier);
    setCarriers(updated);
  };

  const handleDeleteCarrier = (id: string) => {
    const updated = deleteCarrier(id);
    setCarriers(updated);
  };

  const handleResetCarriers = () => {
    const updated = resetCarriers();
    setCarriers(updated);
  };

  const handleSelectCarrierForForm = (carrierName: string) => {
    setPreselectedCarrier(carrierName);
    setActiveTab('form');
  };

  const handleSaveBulkBox = (box: BulkBoxRecord) => {
    const updated = saveBulkBox(box);
    setBulkBoxes(updated);
  };

  const handleDeleteBulkBox = (id: string) => {
    const updated = deleteBulkBox(id);
    setBulkBoxes(updated);
  };

  const handleResetBulkBoxes = () => {
    const updated = resetBulkBoxes();
    setBulkBoxes(updated);
  };

  const handleSelectBulkBoxForForm = (box: BulkBoxRecord) => {
    setPreselectedBulkBox(box);
    setActiveTab('form');
  };

  const handleSaveRoute = (route: RouteRecord) => {
    const updated = saveRoute(route);
    setRoutes(updated);
  };

  const handleDeleteRoute = (id: string) => {
    const updated = deleteRoute(id);
    setRoutes(updated);
  };

  const handleResetRoutes = () => {
    const updated = resetRoutes();
    setRoutes(updated);
  };

  const handleSelectRouteForForm = (routeName: string) => {
    const matchingBox = bulkBoxes.find((b) => (b.routeRemarks || '').toLowerCase() === routeName.toLowerCase());
    if (matchingBox) {
      setPreselectedBulkBox(matchingBox);
    }
    setActiveTab('form');
  };

  // Wait for initial storage check to prevent screen flash
  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. If not authenticated, show protected login screen
  if (!authSession || !authSession.isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col justify-between" id="auth-portal-page">
        <div className="py-4 border-b border-slate-200/80 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              <span>Logistics Consignment Portal</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">Security Gate v2.4</span>
          </div>
        </div>

        <LoginForm onLoginSuccess={handleLoginSuccess} />

        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          Protected Freight & Parcel Consignment Management System • Authorized Personnel Only
        </footer>
      </main>
    );
  }

  // 2. Authenticated area with Navbar, Entry Form, Submitted Registry, Sender Directory, Shipper Directory & Bulk Boxes
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" id="authenticated-app-root">
      {/* Top Application Navbar */}
      <Navbar
        session={authSession}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'form') {
            setEditingShipment(null);
            setPreselectedBulkBox(null);
          } else {
            setPreselectedSender(null);
            setPreselectedCarrier(null);
            setPreselectedBulkBox(null);
            setPreselectedRoute(null);
          }
        }}
        onLogout={handleLogout}
        submissionCount={shipments.length}
        sendersCount={senders.length}
        carriersCount={carriers.length}
        bulkBoxesCount={bulkBoxes.length}
        routesCount={routes.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16" id="app-main-content">
        {activeTab === 'form' ? (
          <ShipmentForm
            onFormSubmit={handleFormSubmit}
            onViewList={() => setActiveTab('list')}
            senders={senders}
            onSaveSender={handleSaveSender}
            onDeleteSender={handleDeleteSender}
            onResetSenders={handleResetSenders}
            preselectedSender={preselectedSender}
            onNavigateToSenders={() => setActiveTab('senders')}
            carriers={carriers}
            onSaveCarrier={handleSaveCarrier}
            onDeleteCarrier={handleDeleteCarrier}
            onResetCarriers={handleResetCarriers}
            preselectedCarrier={preselectedCarrier}
            onNavigateToCarriers={() => setActiveTab('carriers')}
            bulkBoxes={bulkBoxes}
            onSaveBulkBox={handleSaveBulkBox}
            onDeleteBulkBox={handleDeleteBulkBox}
            onResetBulkBoxes={handleResetBulkBoxes}
            preselectedBulkBox={preselectedBulkBox}
            onNavigateToBulkBoxes={() => setActiveTab('bulk-boxes')}
            routes={routes}
            onSaveRoute={handleSaveRoute}
            onDeleteRoute={handleDeleteRoute}
            onResetRoutes={handleResetRoutes}
            preselectedRoute={preselectedRoute}
            onNavigateToRoutes={() => setActiveTab('routes')}
            session={authSession}
            editingShipment={editingShipment}
            onCancelEdit={() => setEditingShipment(null)}
          />
        ) : activeTab === 'list' ? (
          <ShipmentList
            shipments={shipments}
            onOpenDetail={(s) => setSelectedShipment(s)}
            onDeleteShipment={handleDeleteShipment}
            onNavigateToForm={() => {
              setEditingShipment(null);
              setPreselectedBulkBox(null);
              setActiveTab('form');
            }}
            onResetData={handleResetData}
            carriers={carriers}
            routes={routes}
            bulkBoxes={bulkBoxes}
            onUpdateShipment={handleFormSubmit}
            onEditShipmentInForm={(s) => {
              setEditingShipment(s);
              setActiveTab('form');
            }}
          />
        ) : activeTab === 'senders' ? (
          <SendersManager
            senders={senders}
            onSaveSender={handleSaveSender}
            onDeleteSender={handleDeleteSender}
            onResetSenders={handleResetSenders}
            onSelectSenderForForm={handleSelectSenderForForm}
          />
        ) : activeTab === 'carriers' ? (
          <CarriersManager
            carriers={carriers}
            onSaveCarrier={handleSaveCarrier}
            onDeleteCarrier={handleDeleteCarrier}
            onResetCarriers={handleResetCarriers}
            onSelectCarrierForForm={handleSelectCarrierForForm}
          />
        ) : activeTab === 'bulk-boxes' ? (
          <BulkBoxManager
            bulkBoxes={bulkBoxes}
            shipments={shipments}
            routes={routes}
            session={authSession}
            onSaveBulkBox={handleSaveBulkBox}
            onDeleteBulkBox={handleDeleteBulkBox}
            onResetBulkBoxes={handleResetBulkBoxes}
            onSelectForShipment={handleSelectBulkBoxForForm}
          />
        ) : (
          <RoutesManager
            routes={routes}
            bulkBoxes={bulkBoxes}
            shipments={shipments}
            onSaveRoute={handleSaveRoute}
            onDeleteRoute={handleDeleteRoute}
            onResetRoutes={handleResetRoutes}
            onSelectRouteForForm={handleSelectRouteForForm}
            onNavigateToBulkBoxes={() => setActiveTab('bulk-boxes')}
          />
        )}
      </main>

      {/* Detail Modal / Waybill Inspection */}
      <ShipmentDetailModal
        shipment={selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onEdit={(s) => {
          setSelectedShipment(null);
          setEditingShipment(s);
          setActiveTab('form');
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Logged in as <strong className="text-slate-800">{authSession.username}</strong> ({authSession.role})
          </span>
          <span className="font-mono text-slate-400">
            {shipments.length} Packages • {bulkBoxes.length} Bulk Boxes • {senders.length} Senders • {carriers.length} Carriers • {routes.length} Routes
          </span>
        </div>
      </footer>
    </div>
  );
}
