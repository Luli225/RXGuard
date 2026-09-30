import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';

export default function WorkstationLockModal() {
  const { isLocked, unlockWorkstation, user } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const handleUnlock = (e) => {
    e.preventDefault();
    const success = unlockWorkstation(password);
    if (!success) {
      setError(true);
    } else {
      setPassword('');
      setError(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="card max-w-sm w-full p-6 bg-slate-900 border-slate-700 text-white shadow-2xl space-y-5 text-center">
        
        <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/30">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight">Terminal Locked (SQR2)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Protected Health Information obscured for counter security.
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
          <p className="text-slate-400">Current Session User:</p>
          <strong className="text-white text-sm block">{user.fullName}</strong>
          <span className="text-sky-400 font-semibold uppercase text-[10px]">{user.role}</span>
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-medium">
            Incorrect password or PIN. Try <strong>password123</strong> or <strong>1234</strong>.
          </p>
        )}

        <form onSubmit={handleUnlock} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password or credential PIN..."
            className="w-full text-center text-sm bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            autoFocus
            required
          />

          <button
            type="submit"
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors shadow-lg"
          >
            Unlock Workstation
          </button>
        </form>

        <p className="text-[10px] text-slate-500">
          Compliant with Ethiopian Pharmacy Standard ES 7084:2024 Terminal Inactivity Policy.
        </p>

      </div>
    </div>
  );
}
