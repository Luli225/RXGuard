import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Heart, 
  Activity, 
  ShieldAlert, 
  Calendar, 
  Phone, 
  CreditCard 
} from 'lucide-react';

const COMMON_ALLERGIES = ['Penicillins', 'Cephalosporins', 'NSAIDs / Aspirin', 'Sulfonamides', 'Opioids'];
const COMMON_CONDITIONS = ['Type 2 Diabetes', 'Hypertension', 'Asthma / COPD', 'Chronic Kidney Disease', 'Heart Failure'];

export default function AddPatientModal({ isOpen, onClose, onPatientAdded }) {
  const { showNotification } = useAuth();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Male');
  const [weight, setWeight] = useState('');
  const [contactPhone, setContactPhone] = useState('+251 9');
  const [nationalId, setNationalId] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [chronicConditions, setChronicConditions] = useState([]);
  const [renalFunction, setRenalFunction] = useState('Normal');
  const [isPregnantOrLactating, setIsPregnantOrLactating] = useState(false);
  const [customAllergy, setCustomAllergy] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleAllergy = (a) => {
    if (allergies.includes(a)) {
      setAllergies(allergies.filter(item => item !== a));
    } else {
      setAllergies([...allergies, a]);
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const toggleCondition = (c) => {
    if (chronicConditions.includes(c)) {
      setChronicConditions(chronicConditions.filter(item => item !== c));
    } else {
      setChronicConditions([...chronicConditions, c]);
    }
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !chronicConditions.includes(customCondition.trim())) {
      setChronicConditions([...chronicConditions, customCondition.trim()]);
      setCustomCondition('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !age) {
      setError('Patient Full Name and Age are required.');
      return;
    }

    const numAge = Number(age);
    const numWeight = weight ? Number(weight) : undefined;

    // DEF-05: Mandatory weight for pediatric patients under 12
    if (numAge < 12 && (!numWeight || numWeight <= 0)) {
      setError('Mandatory Weight Error: Patient body weight is required for pediatric patients under 12 years of age (DEF-05 / ES 7084:2024).');
      return;
    }

    setLoading(true);

    try {
      const patientId = `PAT-${Date.now().toString().slice(-6)}`;
      const payload = {
        patientId,
        fullName: fullName.trim(),
        age: numAge,
        sex,
        weight: numWeight,
        contactPhone: contactPhone.trim(),
        nationalId: nationalId.trim() || `ET-NAT-${Math.floor(10000000 + Math.random() * 90000000)}`,
        allergies,
        chronicConditions,
        renalFunction,
        isPregnantOrLactating
      };

      const res = await api.createPatient(payload);
      if (res.success && res.data) {
        showNotification(`Patient "${res.data.fullName}" (${res.data.patientId}) registered successfully!`, 'success');
        if (onPatientAdded) onPatientAdded(res.data);
        onClose();
      } else {
        setError(res.error || 'Failed to register patient.');
      }
    } catch (err) {
      setError('Network communication error saving patient record.');
    } finally {
      setLoading(false);
    }
  };

  const isPediatric = Number(age) > 0 && Number(age) < 12;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-900 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Register New Patient (Admin Registry)
              </h2>
              <p className="text-xs text-slate-500">
                Statutory Master Demographic & Clinical Profile • ES 7084:2024 Compliant
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
          
          {/* Row 1: Name & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="e.g. Almaz Bekele"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                <span>National ID / Kebele ID</span>
              </label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="e.g. ET-NAT-84920492"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Demographics (Age, Sex, Weight, Phone) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Age (Years) *</label>
              <input
                type="number"
                min="0"
                max="125"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                placeholder="e.g. 28"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className={`font-bold ${isPediatric ? 'text-rose-700' : 'text-slate-700'}`}>
                Weight (kg) {isPediatric ? '*' : ''}
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={isPediatric ? "Req (<12 yrs)" : "Optional"}
                className={`w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:outline-none ${
                  isPediatric && (!weight || Number(weight) <= 0)
                    ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-sky-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <Phone className="w-3 h-3 text-sky-600" />
                <span>Phone</span>
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+251 9..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pediatric Notice banner */}
          {isPediatric && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>DEF-05 Pediatric Guard:</strong> Patient is under 12 years old ({age} y/o). Body weight is mandatory for milligrams-per-kilogram dosing formula checks.
              </span>
            </div>
          )}

          {/* Row 3: Clinical Conditions & Renal Function */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Renal Function Status</label>
              <select
                value={renalFunction}
                onChange={(e) => setRenalFunction(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Normal">Normal (eGFR &gt; 90 mL/min)</option>
                <option value="Mild Impairment">Mild Impairment (eGFR 60-89)</option>
                <option value="Moderate CKD">Moderate CKD (eGFR 30-59)</option>
                <option value="Severe ESRD">Severe ESRD (eGFR &lt; 30)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Maternal Status</label>
              <div className="flex items-center space-x-2 pt-1.5">
                <input
                  type="checkbox"
                  id="pregnantCheck"
                  checked={isPregnantOrLactating}
                  onChange={(e) => setIsPregnantOrLactating(e.target.checked)}
                  disabled={sex === 'Male'}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <label htmlFor="pregnantCheck" className={`text-xs ${sex === 'Male' ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                  Patient is Pregnant or Lactating (Triggers Teratogen Guard)
                </label>
              </div>
            </div>
          </div>

          {/* Row 4: Allergies Tags */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Documented Drug Allergies (Immune Flags):</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ALLERGIES.map((alg) => {
                const checked = allergies.includes(alg);
                return (
                  <button
                    type="button"
                    key={alg}
                    onClick={() => toggleAllergy(alg)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      checked
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {checked ? `✓ ${alg}` : `+ ${alg}`}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                placeholder="Or type custom allergy..."
                className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomAllergy}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Row 5: Chronic Conditions */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600" />
              <span>Known Chronic Conditions (Disease Contraindication Guard):</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CONDITIONS.map((cond) => {
                const checked = chronicConditions.includes(cond);
                return (
                  <button
                    type="button"
                    key={cond}
                    onClick={() => toggleCondition(cond)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      checked
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {checked ? `✓ ${cond}` : `+ ${cond}`}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                placeholder="Or type custom chronic condition..."
                className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomCondition}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Form Controls */}
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
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? "Registering Patient..." : "Save Patient to Master Registry"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
