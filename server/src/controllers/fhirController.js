const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const Drug = require('../models/Drug');
const SafetyAlert = require('../models/SafetyAlert');
const { evaluatePrescriptionSafety } = require('../services/clinicalVerificationEngine');
const { logAudit } = require('../services/auditService');

/**
 * Ingest HL7 FHIR R4 MedicationRequest (Section 4.7 External Interface UC01)
 * Endpoint: POST /fhir/R4/MedicationRequest
 */
async function ingestFhirMedicationRequest(req, res, next) {
  try {
    const fhirResource = req.body;

    // Validate resourceType
    if (fhirResource.resourceType !== 'MedicationRequest') {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          diagnostics: `Expected resourceType 'MedicationRequest', received '${fhirResource.resourceType}'`
        }]
      });
    }

    // Extract Subject (Patient)
    const patientIdentifier = fhirResource.subject?.identifier?.value || fhirResource.subject?.reference?.replace('Patient/', '') || 'FHIR-PAT-001';
    const patientName = fhirResource.subject?.display || 'External Clinical Patient';

    let patient = await Patient.findOne({ patientId: patientIdentifier });
    if (!patient) {
      patient = new Patient({
        patientId: patientIdentifier,
        fullName: patientName,
        age: 35,
        sex: 'Male',
        contactPhone: '+251 91 000 0000',
        allergies: [],
        chronicConditions: []
      });
      await patient.save();
    }

    // Extract Medication details
    const medicationCodeableConcept = fhirResource.medicationCodeableConcept;
    const drugCoding = medicationCodeableConcept?.coding?.[0];
    const medicationName = drugCoding?.display || drugCoding?.code || 'Amoxicillin';

    // Find in formulary
    let drug = await Drug.findOne({
      $or: [
        { genericName: new RegExp(medicationName, 'i') },
        { brandName: new RegExp(medicationName, 'i') }
      ]
    });

    const dosageInstruction = fhirResource.dosageInstruction?.[0];
    const doseQuantity = dosageInstruction?.doseAndRate?.[0]?.doseQuantity?.value || 500;
    const frequency = dosageInstruction?.text || 'BID - Twice daily';

    const item = {
      itemId: `FHIR-ITEM-${Date.now()}`,
      drugId: drug?._id,
      drugCode: drug?.drugCode || 'EFDA-MED-001',
      genericName: drug?.genericName || medicationName,
      brandName: drug?.brandName || '',
      dosageForm: drug?.dosageForm || 'Tablet',
      strength: drug?.strength || `${doseQuantity}mg`,
      doseQuantity: Number(doseQuantity),
      doseUnit: 'mg',
      frequency: frequency,
      frequencyPerDay: 2,
      durationDays: 7,
      prescribedQuantity: 1
    };

    const prescriberName = fhirResource.requester?.display || 'Dr. External Prescriber';
    const prescriberLicense = fhirResource.requester?.identifier?.value || 'ETH-MD-88001';

    const prescriptionId = `RX-FHIR-${Date.now().toString().slice(-6)}`;
    const prescription = new Prescription({
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
        fullName: prescriberName,
        licenseNumber: prescriberLicense,
        facilityClinic: 'External Regional Clinic (FHIR-Connected)',
        contactNumber: '+251 11 000 0000',
        department: 'EHR Outpatient'
      },
      prescriptionType: 'Acute',
      dateIssued: fhirResource.authoredOn ? new Date(fhirResource.authoredOn) : new Date(),
      items: [item],
      totalPrice: (drug?.unitPrice || 25),
      intakeSource: 'HL7_FHIR_EHR'
    });

    await prescription.save();

    // Run UC02 verification automatically
    const verificationResult = await evaluatePrescriptionSafety(prescription, patient);
    const savedAlertIds = [];
    for (const alt of verificationResult.alerts) {
      const alertDoc = new SafetyAlert(alt);
      await alertDoc.save();
      savedAlertIds.push(alertDoc._id);
    }

    prescription.clinicalRiskScore = verificationResult.riskScore;
    prescription.status = verificationResult.status;
    prescription.safetyAlerts = savedAlertIds;
    await prescription.save();

    await logAudit({
      actionType: 'PRESCRIPTION_INTAKE',
      user: null,
      prescriptionId: prescription.prescriptionId,
      patientId: patient.patientId,
      details: {
        source: 'HL7_FHIR_R4_MedicationRequest',
        fhirId: fhirResource.id || prescriptionId,
        riskScore: verificationResult.riskScore
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      resourceType: 'MedicationRequest',
      id: prescription.prescriptionId,
      status: prescription.status === 'CLINICALLY_APPROVED' ? 'active' : 'on-hold',
      intent: 'order',
      subject: { reference: `Patient/${patient.patientId}`, display: patient.fullName },
      extension: [
        { url: 'http://rxguard.et/fhir/clinical-risk-score', valueDecimal: verificationResult.riskScore },
        { url: 'http://rxguard.et/fhir/verification-status', valueString: prescription.status },
        { url: 'http://rxguard.et/fhir/alert-count', valueInteger: savedAlertIds.length }
      ],
      rxGuardInternalId: prescription._id
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { ingestFhirMedicationRequest };
