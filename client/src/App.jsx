import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import IntakeSplitScreen from './components/IntakeSplitScreen';
import OverrideModal from './components/OverrideModal';
import DispensingBarcodeModal from './components/DispensingBarcodeModal';
import BilingualLabelModal from './components/BilingualLabelModal';
import InventoryView from './components/InventoryView';
import FormularySyncView from './components/FormularySyncView';
import AuditReportsView from './components/AuditReportsView';
import AdminRegistryView from './components/AdminRegistryView';
import LoginView from './components/LoginView';
import WorkstationLockModal from './components/WorkstationLockModal';
import { ShieldCheck, AlertCircle, Sparkles, Activity } from 'lucide-react';

function MainLayout() {
  const { notification, user } = useAuth();
  const [activeTab, setActiveTab] = useState('intake'); // 'intake' | 'dispensing' | 'inventory' | 'formulary' | 'audit'

  // Modals state
  const [overrideModal, setOverrideModal] = useState({ open: false, alert: null, prescription: null });
  const [dispenseModal, setDispenseModal] = useState({ open: false, prescription: null });
  const [bilingualLabelData, setBilingualLabelData] = useState(null);

  const handleOpenOverride = (alert, prescription) => {
    setOverrideModal({ open: true, alert, prescription });
  };

  const handleOpenDispense = (prescription) => {
    setDispenseModal({ open: true, prescription });
  };

  const handleDispenseCompleted = (result) => {
    setDispenseModal({ open: false, prescription: null });
    setBilingualLabelData(result);
  };

  return (
    <div className="min-h-screen flex flex-row bg-slate-900 text-slate-100 antialiased font-sans transition-colors">
      
      {/* 1. Left Vertical Sidebar (Requested Navigation Position) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 text-slate-900 overflow-y-auto">
        
        {/* Dynamic Top Context Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-400" />
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                RxGuard AI Clinical Workspace
              </span>
              <h2 className="text-base font-bold text-slate-900 capitalize tracking-tight flex items-center space-x-2">
                <span>{activeTab === 'intake' ? 'Intake & Real-time AI Verification' : activeTab.replace(/_/g, ' ')}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  ES 7084:2024
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="font-semibold">AI Decision Engine Active (&lt;1.5s)</span>
            </div>
            
            <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700">
              Terminal: <strong className="text-slate-900">Bethel-Station-01</strong>
            </div>
          </div>
        </header>

        {/* Global Notification Toast */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center space-x-3 ${
              notification.type === 'success' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500/50 shadow-emerald-500/20' 
                : notification.type === 'error' 
                ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-500/50 shadow-red-500/20' 
                : 'bg-gradient-to-r from-sky-600 to-indigo-700 text-white border-sky-500/50 shadow-sky-500/20'
            }`}>
              {notification.type === 'success' ? (
                <ShieldCheck className="w-5 h-5 flex-shrink-0 animate-bounce" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
              )}
              <span className="leading-snug">{notification.msg}</span>
            </div>
          </div>
        )}

        {/* Main Routed View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'intake' && (
            <IntakeSplitScreen
              onSelectForOverride={handleOpenOverride}
              onSelectForDispense={handleOpenDispense}
            />
          )}

          {activeTab === 'dispensing' && (
            <div className="space-y-6">
              <IntakeSplitScreen
                onSelectForOverride={handleOpenOverride}
                onSelectForDispense={handleOpenDispense}
              />
            </div>
          )}

          {activeTab === 'inventory' && (
            <InventoryView />
          )}

          {activeTab === 'formulary' && (
            <FormularySyncView />
          )}

          {activeTab === 'audit' && (
            <AuditReportsView />
          )}

          {activeTab === 'admin' && (
            <AdminRegistryView />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            RxGuard AI • Prescription Dispensing & Clinical Verification System
          </p>
          <p className="text-[11px] text-slate-400">
            Tewedaj Community Pharmacy • Bethel Branch, Addis Ababa • Compliant with ES 7084:2024 & EFDA
          </p>
        </footer>

      </div>

      {/* Clinical Override Dialog Modal (UC03 / DEF-02) */}
      {overrideModal.open && overrideModal.alert && (
        <OverrideModal
          alert={overrideModal.alert}
          prescription={overrideModal.prescription}
          onClose={() => setOverrideModal({ open: false, alert: null, prescription: null })}
          onSuccess={() => {}}
        />
      )}

      {/* Dispensing & Barcode Verification Modal (UC05 / US-PT-01) */}
      {dispenseModal.open && dispenseModal.prescription && (
        <DispensingBarcodeModal
          prescription={dispenseModal.prescription}
          onClose={() => setDispenseModal({ open: false, prescription: null })}
          onDispenseCompleted={handleDispenseCompleted}
        />
      )}

      {/* Bilingual Auxiliary Label & POS Receipt Modal (ES 7084:2024 / FR10) */}
      {bilingualLabelData && (
        <BilingualLabelModal
          dispenseData={bilingualLabelData}
          onClose={() => setBilingualLabelData(null)}
        />
      )}

      {/* Workstation Lock Screen (SQR2) */}
      <WorkstationLockModal />

    </div>
  );
}

function AppContent() {
  const { user, token } = useAuth();

  if (!user || !token) {
    return <LoginView />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
