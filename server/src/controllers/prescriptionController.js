const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Drug = require('../models/Drug');
const SafetyAlert = require('../models/SafetyAlert');
const mongoose = require('mongoose');
const { evaluatePrescriptionSafety } = require('../services/clinicalVerificationEngine');
const { logAudit } = require('../services/auditService');

// Create / Digitize Prescription (UC01 / FR01)
async function createPrescription(req, res, next) {
  try {
    const {
      patientId,
      prescriber,
      prescriptionType = 'Acute',
      dateIssued,
      items,
      intakeSource = 'MANUAL_COUNTER'
    } = req.body;

    // 1. Find Patient
    const patient = mongoose.Types.ObjectId.isValid(patientId)
      ? await Patient.findById(patientId)
      : await Patient.findOne({ patientId });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient record not found' });
    }

    // 2. Validate Prescriber License syntax (e.g., ETH-MD-12345 or similar)
    const licensePattern = /^ETH-(MD|PH|RN|HO|CL)-\d{3,6}$/i;
    if (prescriber?.licenseNumber && !licensePattern.test(prescriber.licenseNumber.trim())) {
      // Return clear validation notice
      return res.status(400).json({
        success: false,
        error: `Format Validation Error: Prescriber license "${prescriber.licenseNumber}" does not match statutory licensing format (Expected format e.g., "ETH-MD-12345").`,
        recoveryAction: 'Check the prescription header stamp and re-enter valid regulatory credential.'
      });
    }

    // 3. Check Prescription Validity Date per Ethiopian Standard ES 7084:2024
    const issuedDate = new Date(dateIssued || Date.now());
    const now = new Date();
    const elapsedDays = Math.ceil((now - issuedDate) / (1000 * 60 * 60 * 24));
    
    if (issuedDate > now) {
      return res.status(400).json({
        success: false,
        error: 'Temporal Sequence Error: Prescription issuance date cannot occur in the future.',
        recoveryAction: 'Verify prescription issuance date stamped on physical slip.'
      });
    }

    const maxPermittedDays = prescriptionType === 'Chronic' ? 30 : 15;
    if (elapsedDays > maxPermittedDays) {
      return res.status(400).json({
        success: false,
        error: `Prescription Expired: Elapsed time is ${elapsedDays} days. Maximum allowed under ES 7084:2024 for ${prescriptionType} orders is ${maxPermittedDays} days.`,
        recoveryAction: 'Contact prescribing clinic to issue an updated prescription.'
      });
    }

    // 4. Enrich Items with Drug data & calculate pricing
    let totalPrice = 0;
    const enrichedItems = [];
    for (let idx = 0; idx < (items || []).length; idx++) {
      const it = items[idx];
      let drug = null;
      if (it.drugId) drug = await Drug.findById(it.drugId);
      if (!drug && it.drugCode) drug = await Drug.findOne({ drugCode: it.drugCode });
      if (!drug && it.genericName) drug = await Drug.findOne({ genericName: new RegExp(`^${it.genericName}$`, 'i') });

      const price = (drug?.unitPrice || 25) * (Number(it.prescribedQuantity) || 1);
      totalPrice += price;

      enrichedItems.push({
        itemId: `ITEM-${Date.now()}-${idx + 1}`,
        drugId: drug?._id,
        drugCode: drug?.drugCode || it.drugCode || `DRUG-${idx + 1}`,
        genericName: drug?.genericName || it.genericName,
        brandName: drug?.brandName || it.brandName || '',
        dosageForm: drug?.dosageForm || it.dosageForm || 'Tablet',
        strength: drug?.strength || it.strength || '500mg',
        doseQuantity: Number(it.doseQuantity) || 1,
        doseUnit: it.doseUnit || 'mg',
        frequency: it.frequency || 'BID - Twice daily',
        frequencyPerDay: Number(it.frequencyPerDay) || 2,
        route: it.route || 'Oral',
        durationDays: Number(it.durationDays) || 5,
        prescribedQuantity: Number(it.prescribedQuantity) || 1,
        instructionsAmharic: drug?.defaultInstructions?.amharic || '',
        instructionsEnglish: drug?.defaultInstructions?.english || ''
      });
    }

    const prescriptionId = `RX-2026-${Date.now().toString().slice(-6)}`;

    const newPrescription = new Prescription({
      prescriptionId,
      patient: patient._id,
      patientDemographicsSnapshot: {
        fullName: patient.fullName,
        age: patient.age,
        sex: patient.sex,
        weight: patient.weight,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions
      },
      prescriber: {
        fullName: prescriber?.fullName || 'Dr. Kebede Wolde',
        licenseNumber: prescriber?.licenseNumber || 'ETH-MD-90421',
        facilityClinic: prescriber?.facilityClinic || 'Bethel Primary Health Clinic',
        contactNumber: prescriber?.contactNumber || '+251 91 123 4567',
        department: prescriber?.department || 'Outpatient Clinic'
      },
      prescriptionType,
      dateIssued: issuedDate,
      items: enrichedItems,
      totalPrice,
      intakeSource
    });

    await newPrescription.save();

    // 5. Automatically execute UC02 Clinical Safety Engine
    const verificationResult = await evaluatePrescriptionSafety(newPrescription, patient);
    
    // Save any generated safety alerts
    const savedAlertIds = [];
    for (const alt of verificationResult.alerts) {
      const alertDoc = new SafetyAlert(alt);
      await alertDoc.save();
      savedAlertIds.push(alertDoc._id);
    }

    newPrescription.clinicalRiskScore = verificationResult.riskScore;
    newPrescription.status = verificationResult.status;
    newPrescription.safetyAlerts = savedAlertIds;
    await newPrescription.save();

    // 6. Log Audit
    await logAudit({
      actionType: 'PRESCRIPTION_INTAKE',
      user: req.user,
      prescriptionId: newPrescription.prescriptionId,
      patientId: patient.patientId,
      details: {
        itemCount: newPrescription.items.length,
        status: newPrescription.status,
        riskScore: newPrescription.clinicalRiskScore,
        alertCount: savedAlertIds.length
      },
      ipAddress: req.ip
    });

    const populatedPrescription = await Prescription.findById(newPrescription._id)
      .populate('patient')
      .populate('safetyAlerts');

    res.status(201).json({
      success: true,
      message: 'Prescription captured and clinically verified successfully',
      data: populatedPrescription,
      verificationEngine: {
        riskScore: verificationResult.riskScore,
        durationMs: verificationResult.durationMs,
        alerts: verificationResult.alerts,
        profileNotice: verificationResult.profileNotice
      }
    });
  } catch (err) {
    next(err);
  }
}

// Get all prescriptions
async function getPrescriptions(req, res, next) {
  try {
    const { status, patientId, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (search) {
      query.$or = [
        { prescriptionId: new RegExp(search, 'i') },
        { 'patientDemographicsSnapshot.fullName': new RegExp(search, 'i') },
        { 'prescriber.fullName': new RegExp(search, 'i') }
      ];
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient')
      .populate('safetyAlerts')
      .populate('overrides')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (err) {
    next(err);
  }
}

// Get prescription by ID
async function getPrescriptionById(req, res, next) {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient')
      .populate({
        path: 'safetyAlerts',
        populate: { path: 'overrideLog' }
      })
      .populate('overrides');

    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }

    res.json({ success: true, data: prescription });
  } catch (err) {
    next(err);
  }
}

// Log external prescriber clarification (UC03 alternative flow 2a2)
async function logClarification(req, res, next) {
  try {
    const { physicianName, notes, outcome } = req.body;
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }

    prescription.clarificationLogs.push({
      physicianName: physicianName || prescription.prescriber.fullName,
      notes: notes || 'Telephone query resolved with physician',
      outcome: outcome || 'Prescription adjusted'
    });

    if (outcome === 'SUBSTITUTION_ORDERED') {
      prescription.status = 'UNDER_CLINICAL_REVIEW';
    }

    await prescription.save();
    res.json({ success: true, message: 'Clarification logged successfully', data: prescription });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  logClarification
};
