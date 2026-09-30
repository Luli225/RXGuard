import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, AlertTriangle, ShieldCheck, MapPin, Calendar, Clock, Filter, Plus } from 'lucide-react';

export default function InventoryView() {
  const { user, showNotification } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterNearExpiry, setFilterNearExpiry] = useState(false);
  const [selectedBatchForOverride, setSelectedBatchForOverride] = useState(null);
  const [supervisoryNotes, setSupervisoryNotes] = useState('');

  useEffect(() => {
    loadBatches();
  }, [filterNearExpiry]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await api.getBatches(filterNearExpiry);
      if (res.success) {
        setBatches(res.data);
      }
    } catch (e) {
      console.error('Error fetching inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSupervisoryRelease = async () => {
    if (!selectedBatchForOverride) return;
    try {
      const res = await api.overrideNearExpiryBatch(
        selectedBatchForOverride._id,
        supervisoryNotes || 'Supervisory authorization granted for emergency short-term therapy cycle per DEF-01'
      );
      if (res.success) {
        showNotification(res.message, 'success');
        setSelectedBatchForOverride(null);
        setSupervisoryNotes('');
        loadBatches();
      } else {
        showNotification(res.error || 'Failed to authorize batch', 'error');
      }
    } catch (e) {
      showNotification('Supervisory authorization failed', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ClipboardList className="w-6 h-6 text-sky-600" />
            <span>Perpetual Stock & FEFO Inventory (FR07 / FR08)</span>
          </h1>
          <p className="text-sm text-slate-500">
            First-Expiry-First-Out (FEFO) Allocation • 30-Day Automated Expiry Guard (ES 7084:2024)
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterNearExpiry(!filterNearExpiry)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              filterNearExpiry
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterNearExpiry ? "Showing Near-Expiry (<30d)" : "Show All Lots"}</span>
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Batch / Lot No</th>
                <th className="p-3">Medication Name</th>
                <th className="p-3">Strength & Form</th>
                <th className="p-3">Shelf Location</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Shelf-Life Days</th>
                <th className="p-3">Stock on Hand</th>
                <th className="p-3">Barcode (GS1/UPC)</th>
                <th className="p-3 text-right">FEFO Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map(batch => {
                const daysRemaining = batch.daysToExpiry;
                const isNear = daysRemaining <= 30;

                return (
                  <tr key={batch._id} className={`hover:bg-slate-50 ${isNear ? 'bg-amber-50/40' : ''}`}>
                    <td className="p-3 font-mono font-bold text-slate-900">{batch.batchNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{batch.drugName}</td>
                    <td className="p-3 text-slate-600">{batch.strength} {batch.dosageForm}</td>
                    <td className="p-3 text-slate-700 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      <span>{batch.shelfLocation}</span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {new Date(batch.expiryDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        daysRemaining <= 0 ? 'bg-red-200 text-red-900' :
                        daysRemaining <= 30 ? 'bg-amber-200 text-amber-900' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} days`}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{batch.stockOnHand} packs</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{batch.barcode}</td>
                    <td className="p-3 text-right">
                      {isNear ? (
                        batch.supervisoryReleaseAuthorized ? (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                            Supervisor Released
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedBatchForOverride(batch)}
                            className="px-2.5 py-1 rounded bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600 shadow-sm"
                          >
                            Release (DEF-01)
                          </button>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                          FEFO Eligible
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervisory Override Modal for Near-Expiry (DEF-01) */}
      {selectedBatchForOverride && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-5 bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Supervisory Near-Expiry Release (DEF-01 / FR08)</span>
              </h3>
              <button onClick={() => setSelectedBatchForOverride(null)} className="text-slate-400 font-bold">&times;</button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Batch <strong>{selectedBatchForOverride.batchNumber}</strong> has only <strong>{selectedBatchForOverride.daysToExpiry} days</strong> remaining shelf-life.
              Granting authorization permits emergency dispensing for immediate short-term therapy cycles.
            </p>
            <textarea
              value={supervisoryNotes}
              onChange={(e) => setSupervisoryNotes(e.target.value)}
              rows="3"
              className="w-full text-xs border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Enter supervisory justification note..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedBatchForOverride(null)}
                className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSupervisoryRelease}
                className="px-4 py-1.5 rounded bg-amber-600 text-white font-bold text-xs hover:bg-amber-700"
              >
                Authorize Release
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
