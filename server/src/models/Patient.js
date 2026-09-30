const mongoose = require('mongoose');
const { proxyModel } = require('./modelProxy');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true },
  age: { type: Number, required: true, min: 0 },
  dateOfBirth: { type: Date },
  sex: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  weight: { 
    type: Number, 
    required: function() { return this.age < 12; }
  },
  contactPhone: { type: String, required: true },
  nationalId: { type: String, default: '' },
  allergies: [{ type: String }],
  chronicConditions: [{ type: String }],
  isPregnantOrLactating: { type: Boolean, default: false },
  renalFunction: { 
    type: String, 
    enum: ['Normal', 'Mild Impairment', 'Moderate Impairment', 'Severe Impairment'], 
    default: 'Normal' 
  },
  activeMedications: [{
    drugName: String,
    dosage: String,
    startDate: Date
  }]
}, { timestamps: true });

const schemaMethods = {
  toMaskedJSON() {
    const obj = { ...this };
    if (obj.contactPhone) {
      obj.contactPhone = obj.contactPhone.replace(/(\d{3})\d{4}(\d{3})/, '$1-****-$2');
    }
    if (obj.nationalId) {
      obj.nationalId = '***-***-' + String(obj.nationalId).slice(-4);
    }
    return obj;
  }
};

patientSchema.methods.toMaskedJSON = schemaMethods.toMaskedJSON;

const MongoosePatient = mongoose.model('Patient', patientSchema);
module.exports = proxyModel('Patient', MongoosePatient, schemaMethods);
