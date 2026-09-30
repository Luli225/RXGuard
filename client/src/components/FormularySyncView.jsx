import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Database, Search, RefreshCw, CheckCircle, ShieldCheck, AlertCircle, BookOpen, PlusCircle } from 'lucide-react';
import AddDrugModal from './AddDrugModal';

export default function FormularySyncView() {
  const { user, showNotification } = useAuth();
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDrugModalOpen, setIsDrugModalOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);

  useEffect(() => {
    handleSearch();
  }, [search]);

  const handleSearch = async () => {
    try {
      const res = await api.getDrugCatalog(search);
      if (res.success) {
        setDrugs(res.data);
        setLatencyMs(res.latencyMs);
        if (!selectedDrug && res.data.length > 0) {
          setSelectedDrug(res.data[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching drug catalog:', e);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncEFDA();
      if (res.success) {
        showNotification(res.message, 'success');
        handleSearch();
      } else {
        showNotification(res.error || 'Failed to sync with EFDA portal', 'error');
      }
    } catch (e) {
      showNotification('Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Database className="w-6 h-6 text-sky-600" />
            <span>EFDA Regulatory Formulary & Monograph Search</span>
          </h1>
          <p className="text-sm text-slate-500">
            ES 7084:2024 Drug Registry • Full-Text Monograph Query (<span className="text-emerald-600 font-semibold">&lt; 500ms PQR4</span>)
          </p>
        </div>

        {/* Admin Action Buttons (Add Medication & Sync) */}
        <div className="flex items-center space-x-3">
          {user?.role === 'Administrator' && (
            <button
              onClick={() => setIsDrugModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Medication</span>
            </button>
          )}

          {user.role === 'Technician' ? (
            <span
              title="Formulary governance and sync restricted to Administrators (US-PA-02)"
              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200 cursor-not-allowed flex items-center space-x-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Admin Required (US-PA-02)</span>
            </span>
          ) : (
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? "Synchronizing EFDA Portal..." : "Trigger EFDA Formulary Sync (UC06)"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="card p-3 bg-white border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Generic name, Brand name, Pharmacological class, or Drug Code..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {latencyMs !== null && (
          <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded whitespace-nowrap">
            {latencyMs}ms (&lt; 500ms benchmark)
          </span>
        )}
      </div>

      {/* 2-Column Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* List of Drugs (5 cols) */}
        <div className="lg:col-span-5 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {drugs.map(d => (
            <div
              key={d._id}
              onClick={() => setSelectedDrug(d)}
              className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                selectedDrug?.drugCode === d.drugCode
                  ? 'border-sky-500 bg-sky-50/70 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">{d.genericName}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  d.schedule === 'Controlled / Narcotic' ? 'bg-purple-100 text-purple-900' :
                  d.schedule === 'Restricted Antibiotic' ? 'bg-red-100 text-red-900' :
                  d.schedule === 'OTC' ? 'bg-emerald-100 text-emerald-900' :
                  'bg-blue-100 text-blue-900'
                }`}>
                  {d.schedule}
                </span>
              </div>
              <p className="text-slate-600">
                {d.brandName} • {d.strength} {d.dosageForm}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {d.pharmacologicalClass}
              </p>
            </div>
          ))}
        </div>

        {/* Monograph Details (7 cols) */}
        <div className="lg:col-span-7">
          {selectedDrug ? (
            <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="font-mono text-xs text-sky-600 font-bold block">{selectedDrug.drugCode}</span>
                  <h2 className="text-xl font-bold text-slate-900">{selectedDrug.genericName}</h2>
                  <p className="text-xs text-slate-500">Brand Name: <strong>{selectedDrug.brandName}</strong> • {selectedDrug.strength} {selectedDrug.dosageForm}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Unit Price (ETB):</span>
                  <span className="text-base font-bold text-emerald-600">{selectedDrug.unitPrice?.toFixed(2)} Birr</span>
                </div>
              </div>

              {/* Dosing Boundaries */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
                <div>
                  <span className="font-bold text-slate-700 block">Adult Daily Ceiling:</span>
                  <span className="text-slate-600">
                    Max: {selectedDrug.standardDosageBounds?.maxDailyDose} {selectedDrug.standardDosageBounds?.unit}/day
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">Pediatric Formula (&lt;12y):</span>
                  <span className="text-slate-600">
                    {selectedDrug.pediatricDosing?.mgPerKgPerDay 
                      ? `${selectedDrug.pediatricDosing.mgPerKgPerDay} mg/kg/day (Max ${selectedDrug.pediatricDosing.maxDailyDose}mg)` 
                      : 'Not formulated for pediatrics'}
                  </span>
                </div>
              </div>

              {/* Drug-Drug Interactions */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  Interacting Molecules ({selectedDrug.drugInteractions?.length || 0})
                </h4>
                {(!selectedDrug.drugInteractions || selectedDrug.drugInteractions.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No severe interactions recorded in national formulary.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDrug.drugInteractions.map((inter, i) => (
                      <div key={i} className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900">With {inter.interactingDrugName}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                            {inter.severity} Risk ({inter.riskScore?.toFixed(2)})
                          </span>
                        </div>
                        <p className="text-slate-700">{inter.clinicalEvidence}</p>
                        <p className="text-[11px] text-slate-500 italic">Mechanism: {inter.mechanism}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contraindications */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  Contraindicated Clinical Conditions
                </h4>
                {(!selectedDrug.contraindicatedConditions || selectedDrug.contraindicatedConditions.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No specific absolute contraindications listed.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDrug.contraindicatedConditions.map((c, i) => (
                      <div key={i} className="p-2 rounded bg-red-50 border border-red-200 text-xs">
                        <span className="font-bold text-red-900">{c.condition}:</span>{' '}
                        <span className="text-slate-700">{c.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bilingual Instructions Monograph */}
              <div className="p-3 bg-slate-100 rounded-lg text-xs space-y-1.5 border border-slate-200">
                <span className="font-bold text-slate-700 block">Auxiliary Packaging Texts (ES 7084:2024):</span>
                <p className="ethiopic-font font-medium text-slate-900">
                  🇪🇹 <strong>አማርኛ:</strong> {selectedDrug.defaultInstructions?.amharic}
                </p>
                <p className="text-slate-700 italic">
                  🇬🇧 <strong>English:</strong> {selectedDrug.defaultInstructions?.english}
                </p>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs card bg-white">
              Select a medication from the catalog to review its clinical monograph and interaction profile.
            </div>
          )}
        </div>

      </div>

      {/* Admin Add Drug Modal */}
      <AddDrugModal
        isOpen={isDrugModalOpen}
        onClose={() => setIsDrugModalOpen(false)}
        onDrugAdded={(newDrug) => {
          setDrugs(prev => [newDrug, ...prev]);
          setSelectedDrug(newDrug);
        }}
      />

    </div>
  );
}
