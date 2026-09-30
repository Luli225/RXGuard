const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('rxguard_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },
  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async verifyPin(pin) {
    const res = await fetch(`${API_BASE}/auth/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ pin })
    });
    return res.json();
  },

  // Patients
  async getPatients(mask = false, search = '') {
    const query = new URLSearchParams();
    if (mask) query.append('mask', 'true');
    if (search) query.append('search', search);
    const res = await fetch(`${API_BASE}/patients?${query.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async createPatient(patientData) {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(patientData)
    });
    return res.json();
  },

  // Prescriptions
  async getPrescriptions(status = '', search = '') {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    if (search) query.append('search', search);
    const res = await fetch(`${API_BASE}/prescriptions?${query.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async getPrescriptionById(id) {
    const res = await fetch(`${API_BASE}/prescriptions/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async createPrescription(payload) {
    const res = await fetch(`${API_BASE}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async logClarification(id, payload) {
    const res = await fetch(`${API_BASE}/prescriptions/${id}/clarification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Clinical Verification
  async runVerification(prescriptionId) {
    const res = await fetch(`${API_BASE}/verification/${prescriptionId}/run`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async resolveOverride(alertId, payload) {
    const res = await fetch(`${API_BASE}/verification/override/${alertId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Inventory & Dispensing
  async stageFEFO(prescriptionId) {
    const res = await fetch(`${API_BASE}/dispense/${prescriptionId}/stage-fefo`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async scanBarcode(prescriptionId, itemId, barcode) {
    const res = await fetch(`${API_BASE}/dispense/${prescriptionId}/items/${itemId}/scan-barcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ barcode })
    });
    return res.json();
  },
  async finalizeDispensing(prescriptionId) {
    const res = await fetch(`${API_BASE}/dispense/${prescriptionId}/finalize`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async getBatches(nearExpiryOnly = false) {
    const query = nearExpiryOnly ? '?nearExpiryOnly=true' : '';
    const res = await fetch(`${API_BASE}/inventory/batches${query}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async overrideNearExpiryBatch(batchId, supervisoryNotes) {
    const res = await fetch(`${API_BASE}/inventory/batches/${batchId}/override-near-expiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ supervisoryNotes })
    });
    return res.json();
  },
  async getDrugCatalog(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/inventory/drugs${query}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async createDrug(drugData) {
    const res = await fetch(`${API_BASE}/inventory/drugs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(drugData)
    });
    return res.json();
  },

  // Regulatory & Audit
  async syncEFDA() {
    const res = await fetch(`${API_BASE}/regulatory/sync`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async getAuditLogs(actionType = '') {
    const query = actionType ? `?actionType=${actionType}` : '';
    const res = await fetch(`${API_BASE}/audit${query}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async getOverrideLogs() {
    const res = await fetch(`${API_BASE}/audit/overrides`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async getControlledSubstances() {
    const res = await fetch(`${API_BASE}/audit/controlled-substances`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },
  async resetDatabase() {
    const res = await fetch(`${API_BASE}/seed-reset`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  }
};
