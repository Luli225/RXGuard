import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  PlusCircle, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Pill, 
  Layers, 
  Tag, 
  DollarSign, 
  Barcode, 
  Sparkles,
  MapPin
} from 'lucide-react';

const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Oral Syrup',
  'Oral Suspension',
  'Injection',
  'Ointment / Cream',
  'Inhaler',
  'Eye Drops'
];

const SCHEDULES = [
  'Prescription Only',
  'OTC',
  'Controlled / Narcotic',
  'Restricted Antibiotic'
];

export default function AddDrugModal({ isOpen, onClose, onDrugAdded }) {
  const { showNotification } = useAuth();

  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [drugCode, setDrugCode] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [strength, setStrength] = useState('');
  const [pharmacologicalClass, setPharmacologicalClass] = useState('');
  const [schedule, setSchedule] = useState('Prescription Only');
  const [maxDailyDose, setMaxDailyDose] = useState('');
  const [unitPrice, setUnitPrice] = useState('35.00');
  const [initialStock, setInitialStock] = useState('250');
  const [shelfLocation, setShelfLocation] = useState('Shelf F-01 (General Active Stock)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Auto-generate preview drug code & batch code
  const codePrefix = genericName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'DRUG';
  const previewBarcode = `01003123456789011727091510${codePrefix}01`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!genericName.trim() || !strength.trim() || !unitPrice) {
      setError('Generic Name, Strength (e.g. 400mg), and Unit Price are required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        drugCode: drugCode.trim() || undefined,
        genericName: genericName.trim(),
        brandName: brandName.trim() || genericName.trim(),
        dosageForm,
        strength: strength.trim(),
        pharmacologicalClass: pharmacologicalClass.trim() || 'Therapeutic Agent',
        schedule,
        unitPrice: Number(unitPrice),
        maxDailyDose: maxDailyDose ? Number(maxDailyDose) : undefined,
        initialStock: Number(initialStock) || 200,
        shelfLocation: shelfLocation.trim()
      };

      const res = await api.createDrug(payload);
      if (res.success && res.data) {
        showNotification(`Medication "${res.data.genericName}" (${res.data.strength}) added to EFDA Formulary & Stock!`, 'success');
        if (onDrugAdded) onDrugAdded(res.data, res.batch);
        onClose();
      } else {
        setError(res.error || 'Failed to add medication.');
      }
    } catch (err) {
      setError('Network communication error creating medication record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-900 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Add New Medication to EFDA Formulary (Admin)
              </h2>
              <p className="text-xs text-slate-500">
                Authorizes New Drug Monograph & Generates Initial FEFO Stock with Optical Barcode
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl p-1">&times;</button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Row 1: Generic Name & Brand Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Generic (INN) Name *</label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                required
                placeholder="e.g. Ibuprofen, Omeprazole, Ceftriaxone..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Trade / Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Advil, Losec, Rocephin..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Dosage Form, Strength, Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Dosage Form *</label>
              <select
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {DOSAGE_FORMS.map(df => (
                  <option key={df} value={df}>{df}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Strength / Concentration *</label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                required
                placeholder="e.g. 400mg, 20mg, 1g"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Statutory Schedule</label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {SCHEDULES.map(sc => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Pharmacological Class & Max Daily Dose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Pharmacological Class</label>
              <input
                type="text"
                value={pharmacologicalClass}
                onChange={(e) => setPharmacologicalClass(e.target.value)}
                placeholder="e.g. NSAID / Analgesic, Proton Pump Inhibitor..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Max Daily Dose Boundary (mg)</label>
              <input
                type="number"
                value={maxDailyDose}
                onChange={(e) => setMaxDailyDose(e.target.value)}
                placeholder="e.g. 2400 (for Ibuprofen)"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Pricing & Inventory Auto-Provisioning */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-purple-900 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-purple-700" />
                <span>Automatic FEFO Inventory & Barcode Provisioning:</span>
              </span>
              <span className="text-[10px] text-purple-700 font-mono bg-purple-100 px-2 py-0.5 rounded">
                ES 7084 FEFO Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unit Price (ETB) *</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Initial Stock Units</label>
                <input
                  type="number"
                  min="1"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>Shelf Location</span>
                </label>
                <input
                  type="text"
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                />
              </div>
            </div>

            <div className="text-[11px] text-purple-800 font-mono flex items-center space-x-2 pt-1 border-t border-purple-200">
              <Barcode className="w-4 h-4 text-purple-600" />
              <span>Provisioned Barcode: <strong>{previewBarcode}</strong> (Shelf-life: 18 months)</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? "Adding Drug to Catalog..." : "Save Medication to Formulary"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
