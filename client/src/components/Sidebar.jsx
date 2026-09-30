import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  Activity, 
  Package, 
  Layers, 
  Database, 
  FileText,
  UserCheck,
  ChevronRight,
  Sparkles,
  Stethoscope,
  Scan,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { 
    user, 
    logout, 
    highContrast, 
    setHighContrast, 
    phiMasked, 
    setPhiMasked, 
    setIsLocked 
  } = useAuth();

  const navItems = [
    {
      id: 'intake',
      label: 'Intake & AI Verification',
      sublabel: 'Dual-Pane Screen (UC01/02)',
      icon: Activity,
      color: 'from-sky-500 to-blue-600',
      activeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
    },
    {
      id: 'dispensing',
      label: 'Dispensing & Barcode',
      sublabel: 'Optical Verification (UC05)',
      icon: Scan,
      color: 'from-emerald-500 to-teal-600',
      activeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      id: 'inventory',
      label: 'Perpetual Stock (FEFO)',
      sublabel: '30-Day Expiry Guard (FR07/08)',
      icon: Layers,
      color: 'from-amber-500 to-orange-600',
      activeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'formulary',
      label: 'EFDA Drug Formulary',
      sublabel: 'Sub-500ms Monograph (UC06)',
      icon: Database,
      color: 'from-purple-500 to-indigo-600',
      activeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    },
    {
      id: 'audit',
      label: 'Regulatory Audits',
      sublabel: 'Immutable Ledger (US-PA-01)',
      icon: FileText,
      color: 'from-rose-500 to-pink-600',
      activeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    },
    // Admin Master Registry (Add Patients & Add Medications)
    ...(user?.role === 'Administrator' ? [{
      id: 'admin',
      label: 'Admin Master Registry',
      sublabel: 'Add Patients & Meds (Admin)',
      icon: Database,
      color: 'from-indigo-500 to-purple-600',
      activeColor: 'text-purple-300 bg-purple-500/15 border-purple-500/40'
    }] : [])
  ];

  return (
    <aside className="w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl z-30 flex-shrink-0 min-h-screen">
      
      {/* 1. Header Logo & Brand */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('intake')}>
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/20">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-white to-cyan-300 tracking-tight">
                RxGuard
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                AI 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">
              Tewedaj Pharmacy • Bethel Branch
            </p>
          </div>
        </div>
      </div>

      {/* 2. Active User Persona Card */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-1">
            <UserCheck className="w-3 h-3 text-sky-400" />
            <span>Active Operator (RBAC)</span>
          </span>
          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
            user.role === 'Pharmacist' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
            user.role === 'Technician' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
            'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          }`}>
            {user.role}
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center font-bold text-white text-xs border border-slate-600">
            {user.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{user.licenseNumber || 'EFDA-REGISTERED'}</p>
          </div>
        </div>

        {/* Fixed RBAC Session Status & Sign Out Button */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Role Locked</span>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign out to change professional role"
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600/90 border border-rose-500/30 flex items-center space-x-1 transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 3. Navigation Links List */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full p-2.5 rounded-xl text-left transition-all duration-200 flex items-center space-x-3 group relative border ${
                isActive
                  ? `${item.activeColor} shadow-lg shadow-black/20`
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r bg-gradient-to-b ${item.color}`} />
              )}

              <div className={`p-2 rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'bg-slate-900 shadow' : 'bg-slate-800/60 text-slate-300'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-sky-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  {item.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* 4. Regulatory Standard Badge */}
      <div className="p-3 mx-3 my-2 rounded-xl bg-gradient-to-r from-sky-950/40 to-slate-900 border border-sky-900/40 text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center space-x-1.5 text-sky-400 font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ES 7084:2024 Standards</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-snug">
          EFDA Good Dispensing Practice • Sub-1.5s Clinical Safety Engine
        </p>
      </div>

      {/* 5. Bottom Toolbar Controls */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
        
        {/* PHI Masking Toggle */}
        <button
          onClick={() => setPhiMasked(!phiMasked)}
          title={phiMasked ? "Counter screen PHI masked (Active)" : "Click to mask sensitive patient PHI"}
          className={`p-2 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
            phiMasked 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {phiMasked ? <EyeOff className="w-4 h-4 text-amber-400 animate-pulse" /> : <Eye className="w-4 h-4" />}
          <span className="text-[11px] font-semibold">{phiMasked ? "Masked" : "Mask PHI"}</span>
        </button>

        {/* High Contrast Mode Toggle (UQR2) */}
        <button
          onClick={() => setHighContrast(!highContrast)}
          title="Toggle High Contrast Mode (WCAG 2.1 AA)"
          className={`p-2 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
            highContrast 
              ? 'bg-yellow-400 text-black font-extrabold shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-[11px] font-semibold">Contrast</span>
        </button>

        {/* Workstation Lock Button (SQR2) */}
        <button
          onClick={() => setIsLocked(true)}
          title="Lock Front-Counter Terminal (SQR2)"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
        >
          <Lock className="w-4 h-4" />
        </button>

      </div>

    </aside>
  );
}
