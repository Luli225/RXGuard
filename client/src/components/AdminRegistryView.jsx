import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Pill, 
  UserPlus, 
  PlusCircle, 
  Search, 
  ShieldCheck, 
  Activity, 
  CreditCard, 
  Phone, 
  Sparkles, 
  Layers, 
  Database,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldAlert
} from 'lucide-react';
import AddPatientModal from './AddPatientModal';
import AddDrugModal from './AddDrugModal';

export default function AdminRegistryView() {
  const { user, showNotification } = useAuth();

  if (user?.role !== 'Administrator') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted (Administrator Only)</h2>
        <p className="text-xs text-slate-500">
          Adding new patients, registering formulary medications, and master data registries are reserved strictly for the System Administrator under ES 7084:2024 RBAC policy. Current role: <strong>{user?.role || 'Guest'}</strong>.
        </p>
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState('patients'); // 'patients' | 'drugs' | 'roles'
  const [patients, setPatients] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [drugSearch, setDrugSearch] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDrugs, setLoadingDrugs] = useState(false);

  // Modals
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isDrugModalOpen, setIsDrugModalOpen] = useState(false);

  useEffect(() => {
    loadPatients();
    loadDrugs();
  }, []);

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await api.getPatients(false, patientSearch);
      if (res.success) {
        setPatients(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadDrugs = async () => {
    setLoadingDrugs(true);
    try {
      const res = await api.getDrugCatalog(drugSearch);
      if (res.success) {
        setDrugs(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDrugs(false);
    }
  };

  const handlePatientAdded = (newPatient) => {
    setPatients(prev => [newPatient, ...prev]);
  };

  const handleDrugAdded = (newDrug) => {
    setDrugs(prev => [newDrug, ...prev]);
  };

  const filteredPatients = patients.filter(p => 
    p.fullName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.contactPhone?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const filteredDrugs = drugs.filter(d => 
    d.genericName?.toLowerCase().includes(drugSearch.toLowerCase()) ||
    d.brandName?.toLowerCase().includes(drugSearch.toLowerCase()) ||
    d.drugCode?.toLowerCase().includes(drugSearch.toLowerCase()) ||
    d.pharmacologicalClass?.toLowerCase().includes(drugSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Database className="w-6 h-6 text-purple-600" />
              <span>Admin Master Registry & Formulary Console</span>
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
              Admin Privilege
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authoritative creation and governance of Patient Demographics and EFDA Drug Monographs
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPatientModalOpen(true)}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Register Patient</span>
          </button>

          <button
            onClick={() => setIsDrugModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Medication</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveSubTab('patients')}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center space-x-2 transition-all border-b-2 ${
            activeSubTab === 'patients'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patient Registry ({patients.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('drugs')}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center space-x-2 transition-all border-b-2 ${
            activeSubTab === 'drugs'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Formulary & Drugs ({drugs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roles')}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center space-x-2 transition-all border-b-2 ${
            activeSubTab === 'roles'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>RBAC Role Governance</span>
        </button>
      </div>

      {/* SUB-TAB 1: PATIENTS */}
      {activeSubTab === 'patients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient by name, ID, or phone..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredPatients.length} registered patients
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Patient ID & Name</th>
                  <th className="p-3.5">Demographics</th>
                  <th className="p-3.5">Contact / National ID</th>
                  <th className="p-3.5">Allergies & Immune Flags</th>
                  <th className="p-3.5">Chronic Conditions</th>
                  <th className="p-3.5">Renal Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">
                      No patients found matching your search. Click "+ Register Patient" above to add one.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map(p => (
                    <tr key={p._id || p.patientId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 block text-sm">{p.fullName}</span>
                        <span className="text-[10px] font-mono text-slate-400">{p.patientId}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{p.age} yrs</span> • {p.sex}
                        <span className="block text-[11px] text-slate-500">
                          {p.weight ? `${p.weight} kg` : (p.age < 12 ? '⚠️ Weight missing' : 'N/A')}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-slate-800 block">{p.contactPhone || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.nationalId || 'N/A'}</span>
                      </td>
                      <td className="p-3.5">
                        {p.allergies?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.allergies.map(a => (
                              <span key={a} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No documented allergies</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {p.chronicConditions?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.chronicConditions.map(c => (
                              <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None recorded</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.renalFunction === 'Normal' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {p.renalFunction || 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DRUGS & FORMULARY */}
      {activeSubTab === 'drugs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                placeholder="Search drug by generic name, brand, code, or class..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredDrugs.length} authorized medications
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrugs.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                No medications found matching your query. Click "+ Add Medication" above to register a new drug.
              </div>
            ) : (
              filteredDrugs.map(d => (
                <div key={d._id || d.drugCode} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {d.drugCode}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.schedule === 'OTC' ? 'bg-emerald-50 text-emerald-800' :
                        d.schedule === 'Controlled / Narcotic' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        'bg-sky-50 text-sky-800'
                      }`}>
                        {d.schedule}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 mt-2">
                      {d.genericName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Brand: <strong className="text-slate-700">{d.brandName || d.genericName}</strong>
                    </p>

                    <div className="flex items-center space-x-2 text-xs mt-2 font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100">{d.dosageForm}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100">{d.strength}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-1">
                      {d.pharmacologicalClass}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {d.unitPrice?.toFixed(2)} ETB
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Max: {d.standardDosageBounds?.maxDailyDose || 'N/A'} {d.standardDosageBounds?.unit || 'mg'}/d
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RBAC ROLE GOVERNANCE */}
      {activeSubTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-extrabold text-sm">1. Licensed Pharmacist</h3>
            </div>
            <p className="text-xs text-slate-600">
              Primary healthcare clinician possessing statutory authority under ES 7084:2024 to evaluate drug-drug interactions, allergy contraindications, pediatric dose boundaries, and authorize clinical overrides with PIN.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div>• Clinical Verification & Hold</div>
              <div>• DDI Override with 15+ char rationale</div>
              <div>• Final Dispensing Handover</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-cyan-700">
              <Layers className="w-5 h-5" />
              <h3 className="font-extrabold text-sm">2. Pharmacy Technician</h3>
            </div>
            <p className="text-xs text-slate-600">
              Operational specialist responsible for prescription order intake digitization, managing physical stock allocation by First-Expiry-First-Out (FEFO), and optical barcode verification.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div>• Prescription Entry & Scan Intake</div>
              <div>• FEFO Stock Staging & Pick-list</div>
              <div>• Optical Barcode Verification (&lt;300ms)</div>
              <div>• <em>Clinical override locked</em></div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-purple-700">
              <Database className="w-5 h-5" />
              <h3 className="font-extrabold text-sm">3. System Administrator</h3>
            </div>
            <p className="text-xs text-slate-600">
              Master data governance authority responsible for maintaining statutory drug formularies, registering new patients, managing staff accounts, and performing regulatory audits.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div>• Register New Patients</div>
              <div>• Add New Medicines to Formulary</div>
              <div>• EFDA External Portal Sync</div>
              <div>• Immutable Audit Ledger Review</div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onPatientAdded={handlePatientAdded}
      />

      <AddDrugModal
        isOpen={isDrugModalOpen}
        onClose={() => setIsDrugModalOpen(false)}
        onDrugAdded={handleDrugAdded}
      />

    </div>
  );
}
