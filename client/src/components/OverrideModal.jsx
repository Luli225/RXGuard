import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, KeyRound, CheckSquare, AlertCircle, X, ShieldCheck } from 'lucide-react';

export default function OverrideModal({ alert, prescription, onClose, onSuccess }) {
  const { user, showNotification } = useAuth();

  const [justificationCode, setJustificationCode] = useState('BENEFIT_OUTWEIGHS_RISK');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [pin, setPin] = useState('');
  const [acknowledgedRisk, setAcknowledgedRisk] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const minChars = 15;
  const charsRemaining = Math.max(0, minChars - clinicalNotes.trim().length);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Check Pharmacist Role
    if (user.role !== 'Pharmacist' && user.role !== 'Administrator') {
      setErrorMessage(`Insufficient Privilege: User role "${user.role}" cannot override clinical safety flags. Requires licensed Clinical Pharmacist.`);
      return;
    }

    // UQR3 Two-factor acknowledgement check for Critical warnings
    if (alert.severityLevel === 'Critical' && !acknowledgedRisk) {
      setErrorMessage('Explicit Acknowledgment Required: You must check the clinical risk acknowledgment box before proceeding.');
      return;
    }

    // Notes minimum 15 characters check (Section 4.6)
    if (clinicalNotes.trim().length < minChars) {
      setErrorMessage(`Clinical Rationale Incomplete: Rationale must be at least ${minChars} characters long (${charsRemaining} characters needed).`);
      return;
    }

    // PIN check
    if (!pin) {
      setErrorMessage('PIN Required: Enter your 4-digit pharmacist credential PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        justificationCode,
        clinicalNotes: clinicalNotes.trim(),
        pin: pin.trim()
      };

      const res = await api.resolveOverride(alert._id, payload);
      if (res.success) {
        showNotification('Clinical override successfully authorized and recorded in immutable regulatory ledger (DEF-02)', 'success');
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'Clinical override was rejected.');
      }
    } catch (err) {
      setErrorMessage('Network or server error while submitting override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="card max-w-lg w-full p-6 bg-white shadow-2xl border-slate-300 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Structured Clinical Override (UC03)</h3>
              <p className="text-xs text-slate-500">
                ES 7084:2024 / EFDA Statutory Override Audit Log
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Flagged Alert Summary */}
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-red-900 uppercase tracking-wide">
              {alert.severityLevel} Alert: {alert.drugName}
            </span>
            <span className="font-mono text-red-700 bg-red-100 px-1.5 py-0.5 rounded text-[11px]">
              Risk: {alert.riskScore?.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-red-800 leading-relaxed font-medium">
            {alert.evidenceSummary}
          </p>
          {alert.pharmacologicalMechanism && (
            <p className="text-[11px] text-red-700/80 italic">
              Mechanism: {alert.pharmacologicalMechanism}
            </p>
          )}
        </div>

        {/* Error Callout */}
        {errorMessage && (
          <div className="p-3 rounded-md bg-rose-100 border border-rose-300 text-rose-900 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Standard Justification Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Standard Justification Category (Mandatory) *
            </label>
            <select
              value={justificationCode}
              onChange={(e) => setJustificationCode(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
              required
            >
              <option value="BENEFIT_OUTWEIGHS_RISK">Benefit Outweighs Risk (Clinical Assessment)</option>
              <option value="PRESCRIBER_CONFIRMED_ADJUSTED_MONITORING">Prescriber Confirmed Adjusted Monitoring Protocol</option>
              <option value="DOSE_TITRATED_BY_PRESCRIBER">Dose Titrated Down by Prescriber to Mitigate Risk</option>
              <option value="PATIENT_TOLERATED_PREVIOUSLY">Patient Tolerated Combination Previously Without Adverse Event</option>
              <option value="EMERGENCY_DISPENSE_SHORT_TERM">Emergency Short-Term Dispense (Supervisory Sanctioned)</option>
            </select>
          </div>

          {/* Clinical Rationale Textarea (>= 15 chars) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800">
                Mandatory Clinical Rationale Notes (Min 15 chars) *
              </label>
              <span className={`text-[11px] font-mono ${charsRemaining === 0 ? 'text-emerald-600 font-semibold' : 'text-amber-600'}`}>
                {charsRemaining === 0 ? '✓ Length Requirement Met' : `${charsRemaining} more chars needed`}
              </span>
            </div>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows="3"
              className="w-full text-xs border border-slate-300 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500 focus:outline-none"
              placeholder="Detail specific rationale, e.g., Prescriber lowered statin dose to 20mg and ordered liver enzymes test in 2 weeks."
              required
            />
          </div>

          {/* Two-Factor Risk Acknowledgment Checkbox (UQR3) */}
          {alert.severityLevel === 'Critical' && (
            <label className="flex items-start space-x-2.5 p-2.5 rounded-md bg-amber-50 border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledgedRisk}
                onChange={(e) => setAcknowledgedRisk(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-amber-900 leading-snug">
                <strong>Two-Factor Confirmation (UQR3):</strong> I acknowledge the clinical severity of this drug interaction and accept professional responsibility under EFDA licensing guidelines.
              </span>
            </label>
          )}

          {/* Pharmacist PIN Input */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                <span>Pharmacist Credential PIN *</span>
              </label>
              <span className="text-[10px] text-slate-500">Default PIN: <strong>1234</strong></span>
            </div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              className="w-full text-sm font-mono tracking-widest border border-slate-300 rounded p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none text-center"
              placeholder="••••"
              required
            />
            <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1">
              <span>Signing as: <strong>{user.fullName}</strong> ({user.licenseNumber || 'ETH-PH-70841'})</span>
              <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Immutable 1-to-1 Audit Log</span>
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || charsRemaining > 0 || !pin}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              <span>{isSubmitting ? "Authenticating..." : "Authorize & Sign Override"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
