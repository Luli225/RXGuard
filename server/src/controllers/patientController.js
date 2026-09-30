const Patient = require('../models/Patient');

// Get all patients with optional PHI data masking
async function getPatients(req, res, next) {
  try {
    const { mask, search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { fullName: new RegExp(search, 'i') },
          { patientId: new RegExp(search, 'i') },
          { contactPhone: new RegExp(search, 'i') }
        ]
      };
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });

    if (mask === 'true') {
      return res.json({
        success: true,
        data: patients.map(p => p.toMaskedJSON())
      });
    }

    res.json({ success: true, count: patients.length, data: patients });
  } catch (err) {
    next(err);
  }
}

// Get single patient
async function getPatientById(req, res, next) {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    if (req.query.mask === 'true') {
      return res.json({ success: true, data: patient.toMaskedJSON() });
    }
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

// Create patient with strict pediatric weight check (DEF-05)
async function createPatient(req, res, next) {
  try {
    const {
      patientId,
      fullName,
      age,
      dateOfBirth,
      sex,
      weight,
      contactPhone,
      nationalId,
      allergies,
      chronicConditions,
      isPregnantOrLactating,
      renalFunction,
      activeMedications
    } = req.body;

    // DEF-05: Mandatory weight for pediatric patients under 12
    if (Number(age) < 12 && (!weight || Number(weight) <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Patient body weight is mandatory for pediatric patients under 12 years of age (DEF-05 / ES 7084:2024).'
      });
    }

    const patient = new Patient({
      patientId: patientId || `PAT-${Date.now().toString().slice(-6)}`,
      fullName,
      age: Number(age),
      dateOfBirth,
      sex,
      weight: weight ? Number(weight) : undefined,
      contactPhone,
      nationalId,
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
      isPregnantOrLactating: Boolean(isPregnantOrLactating),
      renalFunction: renalFunction || 'Normal',
      activeMedications: activeMedications || []
    });

    await patient.save();
    res.status(201).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

// Update patient
async function updatePatient(req, res, next) {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient
};
