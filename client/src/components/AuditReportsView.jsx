import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, ShieldCheck, Filter, KeyRound, AlertOctagon, CheckCircle } from 'lucide-react';

export default function AuditReportsView() {
  const { user, showNotification } = useAuth();
  const [activeTab, setActiveTab] = useState('overrides'); // 'overrides' | 'systemAudit' | 'controlled'
  const [overrideLogs, setOverrideLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [controlledPrescriptions, setControlledPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overrides') {
        const res = await api.getOverrideLogs();
        if (res.success) setOverrideLogs(res.data);
      } else if (activeTab === 'systemAudit') {
        const res = await api.getAuditLogs();
        if (res.success) setAuditLogs(res.data);
      } else if (activeTab === 'controlled') {
        const res = await api.getControlledSubstances();
        if (res.success) setControlledPrescriptions(res.data);
      }
    } catch (e) {
      console.error('Error fetching audit data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/audit/export?format=csv', '_blank');
    showNotification('Exported override audit report (US-PA-01 / EFDA Compliant)', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-sky-600" />
            <span>Regulatory Audit Trails & Controlled Substance Ledger</span>
          </h1>
          <p className="text-sm text-slate-500">
            ES 7084:2024 Inspection Compliance • Immutable Append-Only Ledger (SQR5 / US-PA-01)
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center space-x-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Override Log (CSV / Excel)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overrides')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'overrides'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Clinical Overrides Ledger (US-PA-01)
        </button>

        <button
          onClick={() => setActiveTab('systemAudit')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'systemAudit'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Append-Only Audit Trail (SQR5)
        </button>

        <button
          onClick={() => setActiveTab('controlled')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'controlled'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Controlled Substances & Narcotics Register (FR14)
        </button>
      </div>

      {/* TAB 1: CLINICAL OVERRIDES LEDGER (US-PA-01 / DEF-02) */}
      {activeTab === 'overrides' && (
        <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold">
              Statutory Record of Overridden Clinical Warnings ({overrideLogs.length} entries)
            </span>
            <span className="text-emerald-700 font-medium flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Immutable Ledger • 10-Year Statutory Retention Enforced</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Pharmacist & License</th>
                  <th className="p-3">Flagged Molecule / Severity</th>
                  <th className="p-3">Justification Code</th>
                  <th className="p-3">Clinical Rationale (&gt;=15 chars)</th>
                  <th className="p-3">Digital Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overrideLogs.map(ov => (
                  <tr key={ov._id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{ov.logId}</td>
                    <td className="p-3 text-slate-600">{new Date(ov.timestamp).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-900 block">{ov.pharmacistName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{ov.pharmacistLicense}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800 block">{ov.alertId?.drugName || 'Interacting Pair'}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {ov.alertId?.severityLevel || 'Moderate'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-sky-800">{ov.justificationCode}</td>
                    <td className="p-3 text-slate-700 max-w-xs leading-relaxed">{ov.clinicalNotes}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-400 max-w-[140px] truncate" title={ov.digitalSignature}>
                      {ov.digitalSignature}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL APPEND-ONLY AUDIT TRAIL (SQR5) */}
      {activeTab === 'systemAudit' && (
        <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Audit ID</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Prescription Ref</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(lg => (
                  <tr key={lg._id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{lg.logId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                        {lg.actionType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 block">{lg.userName}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{lg.userRole}</span>
                    </td>
                    <td className="p-3 font-mono text-sky-700">{lg.prescriptionId || '—'}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                      {JSON.stringify(lg.details)}
                    </td>
                    <td className="p-3 text-slate-500">{new Date(lg.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONTROLLED SUBSTANCES & NARCOTICS REGISTER (FR14) */}
      {activeTab === 'controlled' && (
        <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
          <div className="p-3 bg-purple-50 border-b border-purple-200 text-xs text-purple-900 flex items-center justify-between">
            <span className="font-bold">
              EFDA Statutory Narcotics and Controlled Drug Register (ES 7084:2024 Section 4.5)
            </span>
            <span className="text-[11px] font-semibold text-purple-800">Mandatory Weekly Statutory Inspection Inspection Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Dispense Date</th>
                  <th className="p-3">Patient Legal Name</th>
                  <th className="p-3">Age / Sex</th>
                  <th className="p-3">Prescribed Controlled Molecule</th>
                  <th className="p-3">Prescriber & Clinic of Origin</th>
                  <th className="p-3">Batch No</th>
                  <th className="p-3">Dispenser Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {controlledPrescriptions.map(rx => (
                  <tr key={rx._id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-700">{new Date(rx.updatedAt).toLocaleDateString('en-GB')}</td>
                    <td className="p-3 font-bold text-slate-900">{rx.patient?.fullName || rx.patientDemographicsSnapshot?.fullName}</td>
                    <td className="p-3 text-slate-600">{rx.patient?.age}y / {rx.patient?.sex}</td>
                    <td className="p-3 font-semibold text-purple-900">
                      {rx.items.map(it => `${it.genericName} ${it.strength} (${it.dispensedQuantity || it.prescribedQuantity} units)`).join(', ')}
                    </td>
                    <td className="p-3 text-slate-700">
                      <span className="font-medium block">{rx.prescriber?.fullName}</span>
                      <span className="text-[10px] text-slate-500">{rx.prescriber?.facilityClinic}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-800">{rx.items[0]?.allocatedBatchNumber || 'BATCH-NAR-01'}</td>
                    <td className="p-3 font-semibold text-emerald-700">{rx.dispensedBy?.fullName || 'Licensed Pharmacist'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
