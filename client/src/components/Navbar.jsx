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
  ClipboardList, 
  Package, 
  Database, 
  FileText,
  UserCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenIntake }) {
  const { 
    user, 
    switchRole, 
    highContrast, 
    setHighContrast, 
    phiMasked, 
    setPhiMasked, 
    setIsLocked 
  } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('intake')}>
            <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">RxGuard</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">AI Verified</span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Tewedaj Community Pharmacy • Bethel Branch, Addis Ababa
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('intake')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
                activeTab === 'intake'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Intake & AI Verification</span>
            </button>

            <button
              onClick={() => setActiveTab('dispensing')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
                activeTab === 'dispensing'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Dispensing & Barcode</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
                activeTab === 'inventory'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Perpetual Stock (FEFO)</span>
            </button>

            <button
              onClick={() => setActiveTab('formulary')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
                activeTab === 'formulary'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>EFDA Formulary</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
                activeTab === 'audit'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Regulatory Audits</span>
            </button>
          </nav>

          {/* Right Controls: Role Switcher, High Contrast, PHI Masking, Workstation Lock */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* PHI Masking Toggle (Section 4.6) */}
            <button
              onClick={() => setPhiMasked(!phiMasked)}
              title={phiMasked ? "Counter screen PHI masked (Active)" : "Click to mask sensitive patient PHI"}
              className={`p-2 rounded-lg border text-xs flex items-center space-x-1 transition-colors ${
                phiMasked 
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-medium' 
                  : 'text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {phiMasked ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
              <span className="hidden lg:inline">{phiMasked ? "PHI Masked" : "Mask PHI"}</span>
            </button>

            {/* High Contrast Mode Toggle (UQR2 / WCAG 2.1 AA) */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              title="Toggle High Contrast Mode (WCAG 2.1 AA 4.5:1 ratio)"
              className={`p-2 rounded-lg border text-xs flex items-center space-x-1 transition-colors ${
                highContrast 
                  ? 'bg-black text-yellow-300 border-white font-bold' 
                  : 'text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {highContrast ? <Sun className="w-4 h-4 text-yellow-300" /> : <Moon className="w-4 h-4" />}
              <span className="hidden lg:inline">Contrast</span>
            </button>

            {/* Lock Screen Button (SQR2) */}
            <button
              onClick={() => setIsLocked(true)}
              title="Lock Front-Counter Terminal (SQR2)"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* RBAC Role Switcher Dropdown */}
            <div className="relative flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user.fullName}</p>
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                  user.role === 'Pharmacist' ? 'bg-emerald-100 text-emerald-800' :
                  user.role === 'Technician' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {user.role}
                </span>
              </div>

              <select
                value={user.role}
                onChange={(e) => switchRole(e.target.value)}
                title="Switch Role for Testing (RBAC Demonstration)"
                className="text-xs bg-slate-100 border border-slate-300 rounded px-2 py-1.5 font-medium text-slate-700 hover:bg-slate-200 cursor-pointer focus:outline-none"
              >
                <option value="Pharmacist">Pharmacist (Sitra)</option>
                <option value="Technician">Technician (Abebe)</option>
                <option value="Administrator">Admin (Dawit)</option>
              </select>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
