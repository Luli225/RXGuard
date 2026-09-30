import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Stethoscope, 
  Package, 
  Settings, 
  Key, 
  User, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

const ROLES = [
  {
    role: 'Pharmacist',
    username: 'sitra_pharmacist',
    defaultPassword: 'password123',
    name: 'Dr. Sitra Temam, BPharm',
    license: 'ETH-PH-70841',
    badge: 'Clinical Verification Authority',
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    icon: Stethoscope,
    scopeSummary: 'Prescription verification, DDI override with PIN (1234), clinical safety engine, dispensing handover.'
  },
  {
    role: 'Technician',
    username: 'abebe_tech',
    defaultPassword: 'password123',
    name: 'Abebe Kebede',
    license: 'ETH-PT-40281',
    badge: 'Inventory & Dispensing Support',
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    icon: Package,
    scopeSummary: 'Prescription intake digitization, FEFO inventory pick-lists, optical barcode verification (<300ms).'
  },
  {
    role: 'Administrator',
    username: 'dawit_admin',
    defaultPassword: 'password123',
    name: 'Dawit Haile',
    license: 'ETH-SYS-ADMIN',
    badge: 'Master Data & Formulary Governance',
    color: 'from-purple-500 to-indigo-600',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    icon: Settings,
    scopeSummary: 'Register new patients, add medications to formulary, EFDA regulatory sync, immutable audit inspection.'
  }
];

export default function LoginView() {
  const { login, notification } = useAuth();

  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [username, setUsername] = useState(ROLES[0].username);
  const [password, setPassword] = useState(ROLES[0].defaultPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectRole = (r) => {
    setSelectedRole(r);
    setUsername(r.username);
    setPassword(r.defaultPassword);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await login(username, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication rejected. Verify credentials.');
      }
    } catch (err) {
      setErrorMessage('Connection error. Ensure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased text-slate-100 relative overflow-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl space-y-8 relative z-10">
        
        {/* Top Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 text-white shadow-xl shadow-sky-500/25 ring-4 ring-sky-400/20 animate-pulse">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-white to-cyan-300">
              RxGuard Clinical Gateway
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xl mx-auto mt-1">
              Prescription Dispensing & Real-time Clinical Verification Engine
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-400/30">
              Ethiopian Standard ES 7084:2024
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              EFDA Good Dispensing Practice
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-400/30">
              Strict RBAC Gateway
            </span>
          </div>
        </div>

        {/* Card: 2-Step Role Selection & Login Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* STEP 1: Role Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Select Your Professional Role First:</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Role is strictly locked upon sign-in (No in-session role switching)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole.role === r.role;

                return (
                  <div
                    key={r.role}
                    onClick={() => handleSelectRole(r)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                      isSelected
                        ? `bg-slate-800/90 ${r.borderColor} ring-2 ring-sky-400/30 shadow-lg shadow-black/40 scale-[1.02]`
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Active Checkmark Pill */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 text-sky-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${r.color} text-white flex items-center justify-center shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                          <span>{r.role}</span>
                        </h3>
                        <p className="text-xs font-semibold text-slate-300">{r.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{r.license}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800">
                      <span className={`text-[10px] font-bold uppercase block tracking-wider ${r.textColor}`}>
                        {r.badge}
                      </span>
                      <p className="text-[11px] text-slate-400 leading-snug mt-1 line-clamp-2">
                        {r.scopeSummary}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Authentication Credentials */}
          <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-800/90 space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Authenticate as {selectedRole.role} ({selectedRole.name}):</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Default password: <code className="text-sky-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">password123</code>
              </span>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>Username / Credential ID:</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter registered username..."
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Password:</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password..."
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-3 pr-10 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick PIN Note for Pharmacist */}
            {selectedRole.role === 'Pharmacist' && (
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 text-sky-300 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Clinical Override PIN credential for this profile: <strong className="font-mono text-white">1234</strong></span>
                </div>
                <span className="text-[10px] text-sky-400 uppercase font-mono">UC03 Ready</span>
              </div>
            )}

            {/* Submit Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-xs sm:text-sm text-white shadow-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                loading
                  ? 'bg-slate-700 opacity-60 cursor-not-allowed'
                  : `bg-gradient-to-r ${selectedRole.color} hover:scale-[1.01] active:scale-[0.99] shadow-sky-500/25 ring-2 ring-white/10`
              }`}
            >
              <span>{loading ? 'Authenticating with EFDA Gateway...' : `Sign In as ${selectedRole.role} (${selectedRole.name})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Security Compliance Footer */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>
            Tewedaj Pharmacy • Bethel Health Center • Terminal: Bethel-Station-01
          </p>
          <p className="text-[11px] text-slate-600">
            Account lockout policy SQR6 enforced: 5 consecutive failed attempts lock workstation for 15 minutes.
          </p>
        </div>

      </div>
    </div>
  );
}
