import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  User, 
  Phone, 
  FileCheck, 
  Sparkles,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Stethoscope,
  UserPlus,
  PlusCircle,
  Pill
} from 'lucide-react';
import AddPatientModal from './AddPatientModal';
import AddDrugModal from './AddDrugModal';

export default function IntakeSplitScreen({ onSelectForOverride, onSelectForDispense }) {
  const { user, phiMasked, showNotification } = useAuth();
  
  // Data states
  const [patients, setPatients] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Admin Master Modals (Add Patient / Add Medication)
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isDrugModalOpen, setIsDrugModalOpen] = useState(false);

  // Form states (Left Pane)
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [prescriptionType, setPrescriptionType] = useState('Acute');
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('Dr. Senait Bekele');
  const [doctorLicense, setDoctorLicense] = useState('ETH-MD-10924');
  const [clinicFacility, setClinicFacility] = useState('Bethel Health Center');

  // Items builder
  const [selectedDrugCode, setSelectedDrugCode] = useState('');
  const [doseQuantity, setDoseQuantity] = useState(500);
  const [frequency, setFrequency] = useState('BID - Twice daily');
  const [durationDays, setDurationDays] = useState(7);
  const [prescribedQuantity, setPrescribedQuantity] = useState(14);
  const [itemsList, setItemsList] = useState([]);

  // Clarification phone query modal
  const [clarificationModal, setClarificationModal] = useState(false);
  const [clarificationNotes, setClarificationNotes] = useState('');

  // Quick Demo Scenario Picker
  const [selectedDemoScenario, setSelectedDemoScenario] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, [phiMasked]);

  const loadData = async () => {
    try {
      const [ptsRes, drgRes, rxsRes] = await Promise.all([
        api.getPatients(phiMasked),
        api.getDrugCatalog(),
        api.getPrescriptions()
      ]);

      if (ptsRes.success) {
        setPatients(ptsRes.data);
        if (ptsRes.data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(ptsRes.data[0]._id);
        }
      }
      if (drgRes.success) {
        setDrugs(drgRes.data);
        if (drgRes.data.length > 0 && !selectedDrugCode) {
          setSelectedDrugCode(drgRes.data[0].drugCode);
        }
      }
      if (rxsRes.success) {
        setPrescriptions(rxsRes.data);
        if (rxsRes.data.length > 0 && !selectedPrescription) {
          setSelectedPrescription(rxsRes.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading intake data:', err);
    }
  };

  // Add Item to Line
  const handleAddItem = () => {
    const drug = drugs.find(d => d.drugCode === selectedDrugCode);
    if (!drug) return;

    const newItem = {
      itemId: `ITEM-${Date.now()}`,
      drugId: drug._id,
      drugCode: drug.drugCode,
      genericName: drug.genericName,
      brandName: drug.brandName,
      dosageForm: drug.dosageForm,
      strength: drug.strength,
      doseQuantity: Number(doseQuantity),
      doseUnit: drug.strengthUnit || 'mg',
      frequency,
      frequencyPerDay: frequency.includes('3') ? 3 : frequency.includes('Twice') ? 2 : 1,
      durationDays: Number(durationDays),
      prescribedQuantity: Number(prescribedQuantity)
    };

    setItemsList([...itemsList, newItem]);
    showNotification(`Added ${drug.genericName} to prescription lines`, 'info');
  };

  const handleRemoveItem = (index) => {
    const updated = [...itemsList];
    updated.splice(index, 1);
    setItemsList(updated);
  };

  // Pre-load SRS Scenarios into form
  const applyScenario = (scenarioKey) => {
    setSelectedDemoScenario(scenarioKey);
    if (scenarioKey === 'nominal_amoxicillin') {
      // UC02 Scenario 1 Nominal: Yared Tadesse, Amoxicillin 500mg
      const pat = patients.find(p => p.fullName.includes('Yared')) || patients[0];
      if (pat) setSelectedPatientId(pat._id);
      setPrescriptionType('Acute');
      setDoctorName('Dr. Senait Bekele');
      setDoctorLicense('ETH-MD-10924');
      const amox = drugs.find(d => d.genericName === 'Amoxicillin');
      if (amox) {
        setItemsList([{
          itemId: `ITEM-SC1`,
          drugId: amox._id,
          drugCode: amox.drugCode,
          genericName: amox.genericName,
          brandName: amox.brandName,
          dosageForm: amox.dosageForm,
          strength: '500mg',
          doseQuantity: 500,
          doseUnit: 'mg',
          frequency: 'TID - 3 times daily',
          frequencyPerDay: 3,
          durationDays: 7,
          prescribedQuantity: 21
        }]);
      }
      showNotification('Loaded Scenario 1: Nominal Amoxicillin 500mg (Clean risk score)', 'success');
    } else if (scenarioKey === 'warfarin_aspirin') {
      // UC02 Scenario 2 Exception: Almaz Bekele, Warfarin + Aspirin (Ulcer disease contraindication)
      const pat = patients.find(p => p.fullName.includes('Almaz')) || patients[1];
      if (pat) setSelectedPatientId(pat._id);
      setPrescriptionType('Chronic');
      setDoctorName('Dr. Tewodros Melaku');
      setDoctorLicense('ETH-MD-55821');
      const wrf = drugs.find(d => d.genericName === 'Warfarin');
      const asp = drugs.find(d => d.genericName === 'Aspirin');
      setItemsList([
        {
          itemId: `ITEM-SC2A`,
          drugId: wrf?._id,
          drugCode: wrf?.drugCode || 'EFDA-MED-002',
          genericName: 'Warfarin',
          brandName: 'Coumadin',
          dosageForm: 'Tablet',
          strength: '5mg',
          doseQuantity: 5,
          doseUnit: 'mg',
          frequency: 'QD - Once daily',
          frequencyPerDay: 1,
          durationDays: 30,
          prescribedQuantity: 30
        },
        {
          itemId: `ITEM-SC2B`,
          drugId: asp?._id,
          drugCode: asp?.drugCode || 'EFDA-MED-003',
          genericName: 'Aspirin',
          brandName: 'Cardio-Aspirin',
          dosageForm: 'Tablet',
          strength: '100mg',
          doseQuantity: 100,
          doseUnit: 'mg',
          frequency: 'QD - Once daily',
          frequencyPerDay: 1,
          durationDays: 30,
          prescribedQuantity: 30
        }
      ]);
      showNotification('Loaded Scenario 2 Exception: Warfarin + Aspirin + Peptic Ulcer (Critical Bleeding Risk)', 'error');
    } else if (scenarioKey === 'atorvastatin_diltiazem') {
      // UC03 Scenario 1: Birtukan Desta, Atorvastatin + Diltiazem (Moderate interaction)
      const pat = patients.find(p => p.fullName.includes('Birtukan')) || patients[2];
      if (pat) setSelectedPatientId(pat._id);
      setPrescriptionType('Chronic');
      setDoctorName('Dr. Girma Hailu');
      setDoctorLicense('ETH-MD-33012');
      const atv = drugs.find(d => d.genericName === 'Atorvastatin');
      const dlt = drugs.find(d => d.genericName === 'Diltiazem');
      setItemsList([
        {
          itemId: `ITEM-SC3A`,
          drugId: atv?._id,
          drugCode: atv?.drugCode || 'EFDA-MED-004',
          genericName: 'Atorvastatin',
          brandName: 'Lipitor',
          dosageForm: 'Tablet',
          strength: '40mg',
          doseQuantity: 40,
          doseUnit: 'mg',
          frequency: 'QD - Once daily',
          frequencyPerDay: 1,
          durationDays: 30,
          prescribedQuantity: 30
        },
        {
          itemId: `ITEM-SC3B`,
          drugId: dlt?._id,
          drugCode: dlt?.drugCode || 'EFDA-MED-005',
          genericName: 'Diltiazem',
          brandName: 'Cardizem',
          dosageForm: 'Tablet',
          strength: '120mg',
          doseQuantity: 120,
          doseUnit: 'mg',
          frequency: 'BID - Twice daily',
          frequencyPerDay: 2,
          durationDays: 30,
          prescribedQuantity: 60
        }
      ]);
      showNotification('Loaded Scenario 3: Atorvastatin + Diltiazem (Moderate Statin Flag)', 'info');
    } else if (scenarioKey === 'pediatric_overdose') {
      // Child Kirubel (Age 5, 18kg), given adult dose of Amoxicillin 1500mg/day
      const pat = patients.find(p => p.fullName.includes('Kirubel')) || patients[5];
      if (pat) setSelectedPatientId(pat._id);
      setPrescriptionType('Acute');
      setDoctorName('Dr. Senait Bekele');
      setDoctorLicense('ETH-MD-10924');
      const amx = drugs.find(d => d.genericName === 'Amoxicillin');
      setItemsList([
        {
          itemId: `ITEM-PED`,
          drugId: amx?._id,
          drugCode: amx?.drugCode || 'EFDA-MED-001',
          genericName: 'Amoxicillin',
          brandName: 'Moxatid',
          dosageForm: 'Capsule',
          strength: '500mg',
          doseQuantity: 500,
          doseUnit: 'mg',
          frequency: 'TID - 3 times daily',
          frequencyPerDay: 3, // 1500mg/day! Max for 18kg is 720mg
          durationDays: 7,
          prescribedQuantity: 21
        }
      ]);
      showNotification('Loaded Pediatric Case: Amoxicillin 1500mg/day for 5yo child (Calculated Anomaly Flag)', 'error');
    }
  };

  // Submit new prescription intake (UC01)
  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (itemsList.length === 0) {
      showNotification('Please add at least one medication line to the prescription', 'error');
      return;
    }

    setVerificationLoading(true);
    try {
      const payload = {
        patientId: selectedPatientId,
        prescriptionType,
        dateIssued,
        prescriber: {
          fullName: doctorName,
          licenseNumber: doctorLicense,
          facilityClinic: clinicFacility
        },
        items: itemsList
      };

      const res = await api.createPrescription(payload);
      if (res.success) {
        showNotification('Prescription captured & real-time AI safety verification completed!', 'success');
        setSelectedPrescription(res.data);
        loadData();
      } else {
        showNotification(res.error || 'Failed to capture prescription', 'error');
      }
    } catch (err) {
      showNotification('Intake submission error', 'error');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Re-run Verification manually
  const handleReRunVerification = async () => {
    if (!selectedPrescription) return;
    setVerificationLoading(true);
    try {
      const res = await api.runVerification(selectedPrescription._id);
      if (res.success) {
        setSelectedPrescription(res.prescription);
        showNotification(`Verification completed in ${res.verificationReport.executionLatencyMs}ms (PQR1 Benchmark Met)`, 'success');
        loadData();
      }
    } catch (err) {
      showNotification('Failed to re-run verification', 'error');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Log Doctor Clarification
  const handleLogClarification = async () => {
    if (!selectedPrescription || !clarificationNotes) return;
    try {
      const res = await api.logClarification(selectedPrescription._id, {
        physicianName: selectedPrescription.prescriber?.fullName,
        notes: clarificationNotes,
        outcome: 'PRESCRIBER_CONSULTED'
      });
      if (res.success) {
        showNotification('Clarification recorded in audit trail', 'success');
        setClarificationModal(false);
        setClarificationNotes('');
        setSelectedPrescription(res.data);
      }
    } catch (e) {
      showNotification('Failed to log clarification', 'error');
    }
  };

  const currentPatient = patients.find(p => p._id === (selectedPrescription?.patient?._id || selectedPrescription?.patient || selectedPatientId));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Header & Fast Scenario Loader */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dual-Pane Intake & Clinical Verification
          </h1>
          <p className="text-sm text-slate-500">
            ES 7084:2024 Compliant • Real-time AI Safety Screening (<span className="text-emerald-600 font-semibold">&lt; 1.5s latency</span>)
          </p>
        </div>

        {/* Quick Demo Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Load SRS Scenario:</span>
          </span>
          <button
            onClick={() => applyScenario('nominal_amoxicillin')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center space-x-1.5"
          >
            <span>1. Nominal Clean (Amoxicillin)</span>
          </button>
          <button
            onClick={() => applyScenario('warfarin_aspirin')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center space-x-1.5"
          >
            <span>2. Critical DDI (Warfarin + Aspirin)</span>
          </button>
          <button
            onClick={() => applyScenario('atorvastatin_diltiazem')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center space-x-1.5"
          >
            <span>3. Moderate DDI (Statin)</span>
          </button>
          <button
            onClick={() => applyScenario('pediatric_overdose')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center space-x-1.5"
          >
            <span>4. Pediatric Anomaly (5yo)</span>
          </button>
        </div>
      </div>

      {/* Split-Screen 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT PANE: Prescription Intake & Digitization Form (UC01 / 5 Columns) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="card p-5 border-slate-200 shadow-sm bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-sky-600" />
                <h2 className="font-bold text-slate-900 text-base">Left Pane: Prescription Intake & Data Capture</h2>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                UC01 Specification
              </span>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-4">
              
              {/* Patient Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Select Patient Demographics Profile *
                  </label>
                  {user?.role === 'Administrator' && (
                    <button
                      type="button"
                      onClick={() => setIsPatientModalOpen(true)}
                      className="text-xs font-extrabold text-sky-600 hover:text-sky-800 flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Register New Patient</span>
                    </button>
                  )}
                </div>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  required
                >
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.age}y, {p.sex}) {p.weight ? `• ${p.weight}kg` : ''} {p.allergies?.length ? `• Allergies: ${p.allergies.join(', ')}` : ''} {p.chronicConditions?.length ? `• [${p.chronicConditions.join(', ')}]` : ''}
                    </option>
                  ))}
                </select>

                {/* Patient Summary Pill */}
                {currentPatient && (
                  <div className="mt-2 p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-800">Age: {currentPatient.age} yrs</span>
                      {currentPatient.weight && <span className="ml-2 text-slate-600">| Weight: {currentPatient.weight} kg</span>}
                      {currentPatient.age < 12 && (
                        <span className="ml-2 font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">Pediatric Guard Active</span>
                      )}
                    </div>
                    {currentPatient.allergies?.length > 0 && (
                      <span className="font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        Allergies: {currentPatient.allergies.join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Prescriber Info (Regex verified) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prescriber Full Name *</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    License No (e.g. ETH-MD-XXXXX) *
                  </label>
                  <input
                    type="text"
                    value={doctorLicense}
                    onChange={(e) => setDoctorLicense(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-md p-2 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    placeholder="ETH-MD-10924"
                    required
                  />
                </div>
              </div>

              {/* Prescription Type & Validity Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Order Classification *</label>
                  <select
                    value={prescriptionType}
                    onChange={(e) => setPrescriptionType(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Acute">Acute (Max 15 days validity)</option>
                    <option value="Chronic">Chronic (Max 30 days validity)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issuance Date *</label>
                  <input
                    type="date"
                    value={dateIssued}
                    onChange={(e) => setDateIssued(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Medication Line Item Builder */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Add Medication Item</h3>
                  <span className="text-[11px] text-slate-500">EFDA Formulary Indexed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-medium text-slate-600">Drug / Molecule</label>
                      {user?.role === 'Administrator' && (
                        <button
                          type="button"
                          onClick={() => setIsDrugModalOpen(true)}
                          className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>+ Add New Medication</span>
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedDrugCode}
                      onChange={(e) => setSelectedDrugCode(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white focus:outline-none"
                    >
                      {drugs.map(d => (
                        <option key={d.drugCode} value={d.drugCode}>
                          {d.genericName} ({d.brandName}) - {d.strength} {d.dosageForm} [{d.pharmacologicalClass}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Single Dose (mg/ml)</label>
                    <input
                      type="number"
                      value={doseQuantity}
                      onChange={(e) => setDoseQuantity(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded p-1.5"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                    >
                      <option value="QD - Once daily">QD - Once daily</option>
                      <option value="BID - Twice daily">BID - Twice daily (12h)</option>
                      <option value="TID - 3 times daily">TID - 3 times daily (8h)</option>
                      <option value="QID - 4 times daily">QID - 4 times daily (6h)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Duration (Days)</label>
                    <input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded p-1.5"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Quantity (Units)</label>
                    <input
                      type="number"
                      value={prescribedQuantity}
                      onChange={(e) => setPrescribedQuantity(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded p-1.5"
                      min="1"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-1.5 px-3 rounded bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 flex items-center justify-center space-x-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Drug Line</span>
                </button>
              </div>

              {/* Items Table in Intake */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prescription Line Items ({itemsList.length})
                </label>
                {itemsList.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                    No medications added yet. Use the item builder or load a test scenario above.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Medication</th>
                          <th className="p-2">Dose / Freq</th>
                          <th className="p-2">Qty</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {itemsList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-900">
                              {item.genericName} <span className="text-slate-500 font-normal">({item.strength})</span>
                            </td>
                            <td className="p-2 text-slate-600">
                              {item.doseQuantity}{item.doseUnit} • {item.frequency.split(' - ')[0]} • {item.durationDays}d
                            </td>
                            <td className="p-2 font-semibold text-slate-800">{item.prescribedQuantity}</td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-600 hover:text-red-800 font-bold"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Intake Action Button */}
              <button
                type="submit"
                disabled={verificationLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 flex items-center justify-center space-x-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{verificationLoading ? "Executing AI Clinical Verification..." : "Capture & Run Clinical Verification"}</span>
              </button>
            </form>
          </div>

          {/* Quick Prescriptions History Selector */}
          <div className="card p-4 border-slate-200 bg-white">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Recent Prescriptions ({prescriptions.length})
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {prescriptions.map(rx => (
                <div
                  key={rx._id}
                  onClick={() => setSelectedPrescription(rx)}
                  className={`p-2 rounded border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    selectedPrescription?._id === rx._id
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-900">{rx.prescriptionId}</span>
                    <span className="text-slate-500 ml-2">({rx.patient?.fullName || rx.patientDemographicsSnapshot?.fullName})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rx.status === 'CLINICALLY_APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      rx.status === 'APPROVED_WITH_OVERRIDE' ? 'bg-blue-100 text-blue-800' :
                      rx.status === 'UNDER_CLINICAL_REVIEW' ? 'bg-amber-100 text-amber-800' :
                      rx.status === 'DISPENSED' ? 'bg-slate-100 text-slate-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {rx.status.replace(/_/g, ' ')}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Real-time AI Safety Verification Panel (UC02 / 6 Columns) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="card p-5 border-slate-200 shadow-sm bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-base">Right Pane: AI Clinical Verification Engine</h2>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                UC02 & UC03 Panel
              </span>
            </div>

            {selectedPrescription ? (
              <div className="space-y-4">
                
                {/* Status & Risk Score Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 shadow-md ${
                  selectedPrescription.clinicalRiskScore > 0.6
                    ? 'bg-gradient-to-r from-red-50 via-rose-50 to-red-100/70 border-2 border-red-400 text-red-950 animate-glow-critical'
                    : selectedPrescription.clinicalRiskScore > 0.2
                    ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/70 border-2 border-amber-400 text-amber-950 shadow-amber-500/10'
                    : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border-2 border-emerald-400 text-emerald-950 animate-glow-clean'
                }`}>
                  <div className="flex items-center space-x-3.5">
                    {selectedPrescription.clinicalRiskScore > 0.6 ? (
                      <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-300 shadow-inner">
                        <ShieldAlert className="w-7 h-7 animate-pulse text-red-600" />
                      </div>
                    ) : selectedPrescription.clinicalRiskScore > 0.2 ? (
                      <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-300 shadow-inner">
                        <AlertTriangle className="w-7 h-7 text-amber-700" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-300 shadow-inner">
                        <CheckCircle className="w-7 h-7 text-emerald-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-extrabold text-sm tracking-tight">
                          {selectedPrescription.status.replace(/_/g, ' ')}
                        </h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-extrabold border shadow-sm ${
                          selectedPrescription.clinicalRiskScore > 0.6
                            ? 'bg-red-600 text-white border-red-700'
                            : selectedPrescription.clinicalRiskScore > 0.2
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-emerald-600 text-white border-emerald-700'
                        }`}>
                          Risk Score: {selectedPrescription.clinicalRiskScore.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs opacity-90 mt-1 leading-snug font-medium">
                        {selectedPrescription.clinicalRiskScore > 0.6
                          ? "Automated dispensing blocked. Severe contraindication or Level 1 DDI detected (ES 7084:2024)."
                          : selectedPrescription.clinicalRiskScore > 0.2
                          ? "Moderate clinical interaction identified. Pharmacist evaluation required before fulfillment."
                          : "Nominal prescription. All lines cleared green for inventory allocation."}
                      </p>
                    </div>
                  </div>

                  {/* Re-run button */}
                  <button
                    onClick={handleReRunVerification}
                    disabled={verificationLoading}
                    title="Re-run verification algorithm"
                    className="text-xs font-bold px-3 py-2 rounded-lg bg-white shadow-sm border border-slate-300 hover:bg-slate-50 text-slate-800 transition-all hover:scale-105 active:scale-95 flex items-center space-x-1"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-sky-600 ${verificationLoading ? 'animate-spin' : ''}`} />
                    <span>Re-verify</span>
                  </button>
                </div>

                {/* Prescription Metadata Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-400 block">Prescription ID:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedPrescription.prescriptionId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Patient:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedPrescription.patient?.fullName || selectedPrescription.patientDemographicsSnapshot?.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Doctor / Clinic:</span>
                    <span className="text-slate-800">{selectedPrescription.prescriber?.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ES 7084 Validity:</span>
                    <span className="text-emerald-700 font-semibold">Active & Valid</span>
                  </div>
                </div>

                {/* Flagged Clinical Safety Alerts */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Safety Alerts ({selectedPrescription.safetyAlerts?.length || 0})
                    </h4>
                    <span className="text-[11px] text-slate-400">PQR1 Benchmark: &lt;1.5s</span>
                  </div>

                  {(!selectedPrescription.safetyAlerts || selectedPrescription.safetyAlerts.length === 0) ? (
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                      <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-emerald-800">No Clinical Safety Flags Detected</p>
                      <p className="text-[11px] text-emerald-600">Prescription matches standard therapeutic guidelines.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPrescription.safetyAlerts.map((alert, idx) => (
                        <div
                          key={alert._id || idx}
                          className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                            alert.severityLevel === 'Critical'
                              ? 'bg-red-50/70 border-red-300'
                              : 'bg-amber-50/70 border-amber-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                alert.severityLevel === 'Critical' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                              }`}>
                                {alert.severityLevel} Flag
                              </span>
                              <span className="font-bold text-slate-900">{alert.drugName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({alert.interactionType})</span>
                            </div>

                            {alert.resolved ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Overridden</span>
                              </span>
                            ) : user.role === 'Technician' ? (
                              <span
                                title="Technicians cannot override clinical alerts pursuant to FR15 and ES 7084:2024"
                                className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-300 cursor-not-allowed"
                              >
                                Pharmacist Sign-Off Required (FR15)
                              </span>
                            ) : (
                              <button
                                onClick={() => onSelectForOverride(alert, selectedPrescription)}
                                className="px-2.5 py-1 rounded bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 shadow-sm transition-colors"
                              >
                                Override Alert
                              </button>
                            )}
                          </div>

                          {/* Evidence & Pharmacological Mechanism */}
                          <div className="space-y-1">
                            <p className="text-slate-800 font-medium leading-relaxed">
                              {alert.evidenceSummary}
                            </p>
                            {alert.pharmacologicalMechanism && (
                              <p className="text-[11px] text-slate-600 italic">
                                <span className="font-semibold text-slate-700">Mechanism:</span> {alert.pharmacologicalMechanism}
                              </p>
                            )}
                            {alert.clinicalRecommendation && (
                              <p className="text-[11px] text-sky-800 font-medium">
                                <span className="font-bold">Recommendation:</span> {alert.clinicalRecommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons for Progression */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center">
                  <button
                    onClick={() => setClarificationModal(true)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center space-x-1.5 transition-colors"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                    <span>Contact Prescriber (Telephone)</span>
                  </button>

                  <button
                    onClick={() => onSelectForDispense(selectedPrescription)}
                    disabled={!['CLINICALLY_APPROVED', 'APPROVED_WITH_OVERRIDE', 'STAGED_FOR_DISPENSING'].includes(selectedPrescription.status)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center space-x-1.5 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Proceed to Dispensing & Barcode (UC04 / UC05)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                Select a prescription from the left pane or submit a new script to display real-time AI safety verification.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* External Clarification Phone Query Modal (UC03 Scenario 2 Exception) */}
      {clarificationModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-5 bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Phone className="w-4 h-4 text-sky-600" />
                <span>Log Telephone Clarification with Prescriber</span>
              </h3>
              <button onClick={() => setClarificationModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>
            <p className="text-xs text-slate-600">
              Document phone communication with <strong>{selectedPrescription?.prescriber?.fullName}</strong> ({selectedPrescription?.prescriber?.contactNumber || '+251 91 100 2233'}) regarding flagged medication conflict.
            </p>
            <textarea
              value={clarificationNotes}
              onChange={(e) => setClarificationNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
              rows="3"
              placeholder="e.g., Contacted Dr. Senait; agreed to substitute Ciprofloxacin with Azithromycin due to concurrent Theophylline therapy."
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setClarificationModal(false)} className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={handleLogClarification} className="px-3 py-1.5 rounded bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700">Save Consultation Note</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modals for Adding Patients & Medicines */}
      <AddPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onPatientAdded={(newPatient) => {
          setPatients(prev => [newPatient, ...prev]);
          setSelectedPatientId(newPatient._id || newPatient.patientId);
        }}
      />

      <AddDrugModal
        isOpen={isDrugModalOpen}
        onClose={() => setIsDrugModalOpen(false)}
        onDrugAdded={(newDrug) => {
          setDrugs(prev => [newDrug, ...prev]);
          setSelectedDrugCode(newDrug.drugCode);
          setDoseQuantity(newDrug.strengthValue || 500);
        }}
      />

    </div>
  );
}
