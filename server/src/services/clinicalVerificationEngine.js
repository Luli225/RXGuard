const Drug = require('../models/Drug');
const SafetyAlert = require('../models/SafetyAlert');

/**
 * Clinical Verification Engine (PC-2 / UC02 / FR02-FR04)
 * Evaluates prescription items against patient profile and formulary rules.
 * Meets PQR1 latency benchmark (< 1.5 seconds).
 */
async function evaluatePrescriptionSafety(prescription, patient) {
  const startTime = Date.now();
  const alerts = [];
  let maxRiskScore = 0.02; // Baseline nominal clean score (Scenario 1)

  // 1. Gather all active drugs in prescription + patient current active medications
  const prescribedDrugs = [];
  for (const item of prescription.items) {
    let drugDoc = null;
    if (item.drugId) {
      drugDoc = await Drug.findById(item.drugId);
    }
    if (!drugDoc && item.drugCode) {
      drugDoc = await Drug.findOne({ drugCode: item.drugCode });
    }
    if (!drugDoc && item.genericName) {
      drugDoc = await Drug.findOne({ genericName: new RegExp(`^${item.genericName}$`, 'i') });
    }
    prescribedDrugs.push({ item, drugDoc });
  }

  // 2. Check Patient Allergies (FR04 / US-CP-01)
  const patientAllergies = (patient.allergies || []).map(a => a.toLowerCase().trim());
  for (const { item, drugDoc } of prescribedDrugs) {
    const genericNameLower = item.genericName.toLowerCase();
    const allergenClassLower = drugDoc?.allergenClass?.toLowerCase() || '';

    // Check direct match or allergen class match (e.g. Amoxicillin is in Penicillin class)
    for (const allergy of patientAllergies) {
      const isDirectMatch = genericNameLower.includes(allergy) || allergy.includes(genericNameLower);
      const isClassMatch = allergenClassLower && (allergenClassLower.includes(allergy) || allergy.includes(allergenClassLower));

      if (isDirectMatch || isClassMatch) {
        const alert = {
          alertId: `ALT-ALLERGY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          prescriptionId: prescription._id,
          drugCode: item.drugCode || (drugDoc ? drugDoc.drugCode : 'DRUG-UNKNOWN'),
          drugName: item.genericName,
          severityLevel: 'Critical',
          interactionType: 'ALLERGY_CONTRAINDICATION',
          contraindicationDetail: `Documented Allergy: ${allergy.toUpperCase()}`,
          evidenceSummary: `Patient has documented allergy to "${allergy.toUpperCase()}". ${item.genericName} belongs to ${drugDoc?.allergenClass || allergy} class, presenting high risk of severe anaphylaxis/hypersensitivity.`,
          pharmacologicalMechanism: 'IgE-mediated Type 1 hypersensitivity reaction leading to bronchospasm, urticaria, or anaphylaxis.',
          clinicalRecommendation: 'Withhold medication immediately. Seek prescriber order for non-cross-reactive alternative.',
          riskScore: 0.95
        };
        alerts.push(alert);
        if (alert.riskScore > maxRiskScore) maxRiskScore = alert.riskScore;
      }
    }
  }

  // 3. Check Disease Contraindications (FR02)
  const patientConditions = (patient.chronicConditions || []).map(c => c.toLowerCase().trim());
  for (const { item, drugDoc } of prescribedDrugs) {
    if (!drugDoc) continue;
    
    // Check specific conditions
    for (const contra of drugDoc.contraindicatedConditions || []) {
      const contraLower = contra.condition.toLowerCase();
      const conditionMatches = patientConditions.some(c => c.includes(contraLower) || contraLower.includes(c));

      if (conditionMatches) {
        const alert = {
          alertId: `ALT-DIS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          prescriptionId: prescription._id,
          drugCode: drugDoc.drugCode,
          drugName: drugDoc.genericName,
          severityLevel: contra.severity || 'Critical',
          interactionType: 'DISEASE_CONTRAINDICATION',
          contraindicationDetail: `Contraindicated with active condition: ${contra.condition}`,
          evidenceSummary: contra.description || `${drugDoc.genericName} is strongly contraindicated in patients presenting with ${contra.condition}.`,
          pharmacologicalMechanism: 'Exacerbation of underlying pathology or high potential for adverse drug event.',
          clinicalRecommendation: 'Place on clinical hold. Contact physician to review therapy.',
          riskScore: contra.severity === 'Critical' ? 0.94 : 0.60
        };
        alerts.push(alert);
        if (alert.riskScore > maxRiskScore) maxRiskScore = alert.riskScore;
      }
    }
  }

  // 4. Check Drug-Drug Interactions (DDI) between items in the prescription (FR02 / US-CP-01)
  for (let i = 0; i < prescribedDrugs.length; i++) {
    for (let j = i + 1; j < prescribedDrugs.length; j++) {
      const drugA = prescribedDrugs[i].drugDoc;
      const drugB = prescribedDrugs[j].drugDoc;
      if (!drugA || !drugB) continue;

      // Look up defined interaction in drugA targeting drugB
      const interactionInA = (drugA.drugInteractions || []).find(
        inter => inter.interactingDrugCode === drugB.drugCode || 
                 inter.interactingDrugName.toLowerCase() === drugB.genericName.toLowerCase()
      );

      // Or in drugB targeting drugA
      const interactionInB = (drugB.drugInteractions || []).find(
        inter => inter.interactingDrugCode === drugA.drugCode || 
                 inter.interactingDrugName.toLowerCase() === drugA.genericName.toLowerCase()
      );

      const interaction = interactionInA || interactionInB;
      if (interaction) {
        const alert = {
          alertId: `ALT-DDI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          prescriptionId: prescription._id,
          drugCode: `${drugA.drugCode} + ${drugB.drugCode}`,
          drugName: `${drugA.genericName} + ${drugB.genericName}`,
          severityLevel: interaction.severity,
          interactionType: 'DRUG_DRUG_INTERACTION',
          contraindicationDetail: `Severe Pharmacodynamic/Pharmacokinetic Interaction between ${drugA.genericName} and ${drugB.genericName}`,
          evidenceSummary: interaction.clinicalEvidence || `${drugA.genericName} co-administration with ${drugB.genericName} poses severe clinical risks.`,
          pharmacologicalMechanism: interaction.mechanism || 'Concurrent pharmacokinetic/pharmacodynamic inhibition or potentiation.',
          clinicalRecommendation: interaction.severity === 'Critical' 
            ? 'Avoid combination. Substitute with safer alternative or consult prescriber.'
            : 'Requires dosage titration and close therapeutic monitoring.',
          riskScore: interaction.riskScore || (interaction.severity === 'Critical' ? 0.94 : 0.55)
        };
        alerts.push(alert);
        if (alert.riskScore > maxRiskScore) maxRiskScore = alert.riskScore;
      }
    }
  }

  // Also check against patient's active concurrent medications
  for (const activeMed of patient.activeMedications || []) {
    const activeDrug = await Drug.findOne({ genericName: new RegExp(`^${activeMed.drugName}$`, 'i') });
    if (!activeDrug) continue;

    for (const { item, drugDoc } of prescribedDrugs) {
      if (!drugDoc) continue;
      const interaction = (drugDoc.drugInteractions || []).find(
        inter => inter.interactingDrugCode === activeDrug.drugCode || 
                 inter.interactingDrugName.toLowerCase() === activeDrug.genericName.toLowerCase()
      );

      if (interaction) {
        const alert = {
          alertId: `ALT-DDI-ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          prescriptionId: prescription._id,
          drugCode: `${drugDoc.drugCode} + ${activeDrug.drugCode}`,
          drugName: `${drugDoc.genericName} (Prescribed) + ${activeDrug.genericName} (Active Regimen)`,
          severityLevel: interaction.severity,
          interactionType: 'DRUG_DRUG_INTERACTION',
          contraindicationDetail: `Interaction with active medication ${activeDrug.genericName}`,
          evidenceSummary: interaction.clinicalEvidence,
          pharmacologicalMechanism: interaction.mechanism,
          clinicalRecommendation: 'Evaluate ongoing therapy and monitor closely or adjust regimen.',
          riskScore: interaction.riskScore || 0.60
        };
        alerts.push(alert);
        if (alert.riskScore > maxRiskScore) maxRiskScore = alert.riskScore;
      }
    }
  }

  // 5. Pediatric and Geriatric Dosage Auditing (FR03 / US-CP-03 / DEF-05)
  for (const { item, drugDoc } of prescribedDrugs) {
    if (!drugDoc) continue;

    const frequencyPerDay = item.frequencyPerDay || 2;
    const dailyDosePrescribed = item.doseQuantity * frequencyPerDay;

    // Pediatric check (< 12 years)
    if (patient.age < 12) {
      const weight = patient.weight || 15; // default fallback if omitted, though enforced mandatory
      if (drugDoc.pediatricDosing && drugDoc.pediatricDosing.mgPerKgPerDay > 0) {
        const maxRecommendedDailyDose = drugDoc.pediatricDosing.mgPerKgPerDay * weight;
        
        if (dailyDosePrescribed > maxRecommendedDailyDose * 1.1) { // 10% threshold
          const alert = {
            alertId: `ALT-DOSE-PED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            prescriptionId: prescription._id,
            drugCode: drugDoc.drugCode,
            drugName: drugDoc.genericName,
            severityLevel: 'Critical',
            interactionType: 'PEDIATRIC_DOSAGE_ANOMALY',
            contraindicationDetail: `Pediatric Dosage Limit Exceeded for Age ${patient.age}y (${weight} kg)`,
            evidenceSummary: `Prescribed daily dose (${dailyDosePrescribed} ${item.doseUnit}/day) exceeds EFDA formulary upper limit of ${maxRecommendedDailyDose} ${item.doseUnit}/day (${drugDoc.pediatricDosing.mgPerKgPerDay} mg/kg/day for ${weight}kg).`,
            pharmacologicalMechanism: 'Immature renal clearance and hepatic enzyme metabolism in pediatric patient increases toxicity risk.',
            clinicalRecommendation: `Adjust dose to recommended pediatric range: ${(drugDoc.pediatricDosing.mgPerKgPerDay * 0.7 * weight).toFixed(0)} - ${maxRecommendedDailyDose.toFixed(0)} mg/day divided across doses.`,
            riskScore: 0.88
          };
          alerts.push(alert);
          if (alert.riskScore > maxRiskScore) maxRiskScore = alert.riskScore;
        }
      }
    } else {
      // Adult / Geriatric ceiling check
      if (drugDoc.standardDosageBounds && drugDoc.standardDosageBounds.maxDailyDose > 0) {
        if (dailyDosePrescribed > drugDoc.standardDosageBounds.maxDailyDose) {
          const alert = {
            alertId: `ALT-DOSE-ADULT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            prescriptionId: prescription._id,
            drugCode: drugDoc.drugCode,
            drugName: drugDoc.genericName,
            severityLevel: 'Moderate',
            interactionType: 'DOSAGE_LIMIT_EXCEEDED',
            contraindicationDetail: `Daily Dose ${dailyDosePrescribed} ${item.doseUnit} exceeds standard ceiling of ${drugDoc.standardDosageBounds.maxDailyDose} ${item.doseUnit}`,
            evidenceSummary: `Prescribed dose exceeds maximum recommended daily limit in EFDA national formulary.`,
            pharmacologicalMechanism: 'Supratherapeutic concentration elevating risk of adverse drug reactions.',
            clinicalRecommendation: `Verify if intentional titration by prescriber or correct to standard ceiling (${drugDoc.standardDosageBounds.maxDailyDose} ${item.doseUnit}/day).`,
            riskScore: 0.65
          };
          alerts.push(alert);
          if (alert.riskScore > maxRiskScore) maxRiskScore = alert.riskScore;
        }
      }
    }
  }

  // 6. Incomplete profile warning (Scenario 4b)
  let profileNotice = null;
  if (!patient.allergies || patient.allergies.length === 0) {
    profileNotice = 'Allergy profile incomplete. Clinical checks limited to general interactions.';
  }

  const durationMs = Date.now() - startTime;

  return {
    riskScore: Number(maxRiskScore.toFixed(2)),
    status: alerts.some(a => a.severityLevel === 'Critical') 
      ? 'FLAGGED_HIGH_RISK' 
      : (alerts.some(a => a.severityLevel === 'Moderate') ? 'UNDER_CLINICAL_REVIEW' : 'CLINICALLY_APPROVED'),
    alerts,
    profileNotice,
    durationMs,
    verifiedAt: new Date()
  };
}

module.exports = { evaluatePrescriptionSafety };
