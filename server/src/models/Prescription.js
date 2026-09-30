const mongoose = require('mongoose');
const { proxyModel } = require('./modelProxy');

const prescriptionItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  drugId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug' },
  drugCode: { type: String, required: true },
  genericName: { type: String, required: true },
  brandName: { type: String, default: '' },
  dosageForm: { type: String, required: true },
  strength: { type: String, required: true },
  doseQuantity: { type: Number, required: true, min: [0.01, 'Dose must be greater than zero'] },
  doseUnit: { type: String, default: 'mg' },
  frequency: { type: String, required: true },
  frequencyPerDay: { type: Number, default: 2, min: 1 },
  route: { type: String, default: 'Oral' },
  durationDays: { type: Number, required: true, min: [1, 'Duration must be at least 1 day'] },
  prescribedQuantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  dispensedQuantity: { type: Number, default: 0 },
  allocatedBatchNumber: { type: String, default: '' },
  scannedBarcode: { type: String, default: '' },
  isBarcodeVerified: { type: Boolean, default: false },
  itemStatus: { 
    type: String, 
    enum: ['PENDING', 'FLAGGED', 'APPROVED', 'VERIFIED_SCANNED', 'DISPENSED'],
    default: 'PENDING'
  },
  instructionsAmharic: { type: String, default: '' },
  instructionsEnglish: { type: String, default: '' }
});

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  patientDemographicsSnapshot: {
    fullName: String,
    age: Number,
    sex: String,
    weight: Number,
    allergies: [String],
    chronicConditions: [String]
  },
  prescriber: {
    fullName: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    facilityClinic: { type: String, required: true },
    contactNumber: { type: String, default: '' },
    department: { type: String, default: 'General Medicine' }
  },
  prescriptionType: { 
    type: String, 
    enum: ['Acute', 'Chronic'], 
    default: 'Acute' 
  },
  dateIssued: { type: Date, required: true },
  intakeDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: [
      'PENDING_VERIFICATION',
      'UNDER_CLINICAL_REVIEW',
      'FLAGGED_HIGH_RISK',
      'CLINICALLY_APPROVED',
      'APPROVED_WITH_OVERRIDE',
      'CLINICAL_HOLD',
      'STAGED_FOR_DISPENSING',
      'DISPENSED',
      'REJECTED'
    ],
    default: 'PENDING_VERIFICATION'
  },
  items: [prescriptionItemSchema],
  clinicalRiskScore: { type: Number, default: 0.0, min: 0, max: 1 },
  safetyAlerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SafetyAlert' }],
  overrides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OverrideLog' }],
  clarificationLogs: [{
    timestamp: { type: Date, default: Date.now },
    physicianName: String,
    notes: String,
    outcome: String
  }],
  totalPrice: { type: Number, default: 0 },
  dispensedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: String,
    role: String,
    timestamp: Date
  },
  bilingualLabelGenerated: { type: Boolean, default: false },
  receiptNumber: { type: String, default: '' },
  intakeSource: { type: String, enum: ['MANUAL_COUNTER', 'HL7_FHIR_EHR', 'ELECTRONIC_PORTAL'], default: 'MANUAL_COUNTER' }
}, { timestamps: true });

const schemaMethods = {
  validatePrescriptionValidity() {
    const now = new Date();
    const issued = new Date(this.dateIssued);
    const diffDays = Math.ceil((now - issued) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { valid: false, error: 'Prescription issuance date cannot be in the future' };
    }
    
    const maxDays = this.prescriptionType === 'Chronic' ? 30 : 15;
    if (diffDays > maxDays) {
      return { 
        valid: false, 
        error: `Prescription has expired (${diffDays} days old). Limit for ${this.prescriptionType} script is ${maxDays} days under ES 7084:2024.` 
      };
    }
    return { valid: true, daysRemaining: maxDays - diffDays };
  }
};

prescriptionSchema.methods.validatePrescriptionValidity = schemaMethods.validatePrescriptionValidity;

const MongoosePrescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = proxyModel('Prescription', MongoosePrescription, schemaMethods);
