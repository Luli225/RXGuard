const User = require('../models/User');
const Patient = require('../models/Patient');
const Drug = require('../models/Drug');
const BatchInventory = require('../models/BatchInventory');
const Prescription = require('../models/Prescription');
const SafetyAlert = require('../models/SafetyAlert');
const OverrideLog = require('../models/OverrideLog');
const AuditLog = require('../models/AuditLog');
const { evaluatePrescriptionSafety } = require('../services/clinicalVerificationEngine');

async function seedDatabase() {
  console.log('[RxGuard Seed] Cleaning existing data...');
  await User.deleteMany({});
  await Patient.deleteMany({});
  await Drug.deleteMany({});
  await BatchInventory.deleteMany({});
  await Prescription.deleteMany({});
  await SafetyAlert.deleteMany({});
  await OverrideLog.deleteMany({});
  await AuditLog.deleteMany({});

  console.log('[RxGuard Seed] Seeding Users with Argon2/Bcrypt hash work factor 12 (SQR1)...');
  const pharmacist = new User({
    username: 'sitra_pharmacist',
    email: 'sitra@tewedajpharmacy.com',
    password: 'password123',
    fullName: 'Sitra Temam',
    role: 'Pharmacist',
    licenseNumber: 'ETH-PH-70841',
    pinCode: '1234'
  });
  await pharmacist.save();

  const technician = new User({
    username: 'abebe_tech',
    email: 'abebe@tewedajpharmacy.com',
    password: 'password123',
    fullName: 'Abebe Kebede',
    role: 'Technician',
    licenseNumber: 'ETH-TECH-33219'
  });
  await technician.save();

  const admin = new User({
    username: 'dawit_admin',
    email: 'dawit@tewedajpharmacy.com',
    password: 'password123',
    fullName: 'Dawit Haile',
    role: 'Administrator',
    licenseNumber: 'ETH-ADM-00142',
    pinCode: '9999'
  });
  await admin.save();

  console.log('[RxGuard Seed] Seeding Drugs and Formulary rules...');
  const drugsData = [
    {
      drugCode: 'EFDA-MED-001',
      genericName: 'Amoxicillin',
      brandName: 'Moxatid',
      dosageForm: 'Capsule',
      strength: '500mg',
      strengthValue: 500,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Penicillin Antibiotic',
      allergenClass: 'Penicillin',
      schedule: 'Prescription Only',
      standardDosageBounds: { minDailyDose: 750, maxDailyDose: 3000, unit: 'mg' },
      pediatricDosing: { minAgeMonths: 3, mgPerKgPerDay: 40, maxDailyDose: 1500 },
      storagePrecautions: {
        amharic: 'ከቀጥታ የፀሐይ ብርሃን እና እርጥበት ርቆ ከ25 ዲግሪ ሴንቲግሬድ በታች ይቀመጥ።',
        english: 'Store below 25°C away from direct sunlight and moisture.'
      },
      defaultInstructions: {
        amharic: '1 እንክብል በቀን ሦስት ጊዜ በየ 8 ሰዓቱ ከምግብ በኋላ ይውሰዱ። ሙሉውን ኮርስ ይጨርሱ።',
        english: 'Take 1 capsule every 8 hours with or after meals. Complete full course.'
      },
      unitPrice: 28.50
    },
    {
      drugCode: 'EFDA-MED-002',
      genericName: 'Warfarin',
      brandName: 'Coumadin',
      dosageForm: 'Tablet',
      strength: '5mg',
      strengthValue: 5,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Oral Anticoagulant',
      schedule: 'Prescription Only',
      standardDosageBounds: { minDailyDose: 2, maxDailyDose: 10, unit: 'mg' },
      contraindicatedConditions: [
        {
          condition: 'Active Peptic Ulcer',
          severity: 'Critical',
          description: 'Severe risk of catastrophic gastrointestinal hemorrhage. Absolute contraindication unless managed with strict clinical oversight.'
        }
      ],
      drugInteractions: [
        {
          interactingDrugCode: 'EFDA-MED-003',
          interactingDrugName: 'Aspirin',
          severity: 'Critical',
          mechanism: 'Synergistic platelet and coagulation inhibition causing massive elevated risk of major systemic bleed.',
          clinicalEvidence: 'ES 7084:2024 / EFDA Formulary Level 1 Critical Flag. Co-administration increases bleeding index by >400%.',
          riskScore: 0.94
        }
      ],
      unitPrice: 15.00
    },
    {
      drugCode: 'EFDA-MED-003',
      genericName: 'Aspirin',
      brandName: 'Cardio-Aspirin',
      dosageForm: 'Tablet',
      strength: '100mg',
      strengthValue: 100,
      strengthUnit: 'mg',
      pharmacologicalClass: 'NSAID / Antiplatelet',
      schedule: 'OTC',
      standardDosageBounds: { minDailyDose: 75, maxDailyDose: 325, unit: 'mg' },
      contraindicatedConditions: [
        {
          condition: 'Active Peptic Ulcer',
          severity: 'Critical',
          description: 'Direct mucosal ulceration risk and antiplatelet-induced GI bleeding.'
        }
      ],
      unitPrice: 8.50
    },
    {
      drugCode: 'EFDA-MED-004',
      genericName: 'Atorvastatin',
      brandName: 'Lipitor',
      dosageForm: 'Tablet',
      strength: '40mg',
      strengthValue: 40,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Statin / HMG-CoA Reductase Inhibitor',
      schedule: 'Prescription Only',
      standardDosageBounds: { minDailyDose: 10, maxDailyDose: 80, unit: 'mg' },
      drugInteractions: [
        {
          interactingDrugCode: 'EFDA-MED-005',
          interactingDrugName: 'Diltiazem',
          severity: 'Moderate',
          mechanism: 'Diltiazem moderately inhibits CYP3A4 metabolism of Atorvastatin, elevating systemic statin plasma exposure.',
          clinicalEvidence: 'EFDA Clinical Guideline INT-01: Risk of statin-induced myopathy or elevated transaminases. Dose titration recommended.',
          riskScore: 0.55
        }
      ],
      unitPrice: 45.00
    },
    {
      drugCode: 'EFDA-MED-005',
      genericName: 'Diltiazem',
      brandName: 'Cardizem',
      dosageForm: 'Tablet',
      strength: '120mg',
      strengthValue: 120,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Calcium Channel Blocker',
      schedule: 'Prescription Only',
      standardDosageBounds: { minDailyDose: 60, maxDailyDose: 360, unit: 'mg' },
      unitPrice: 32.00
    },
    {
      drugCode: 'EFDA-MED-006',
      genericName: 'Ciprofloxacin',
      brandName: 'Cipro-Denk',
      dosageForm: 'Tablet',
      strength: '500mg',
      strengthValue: 500,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Fluoroquinolone Antibiotic',
      schedule: 'Restricted Antibiotic',
      standardDosageBounds: { minDailyDose: 500, maxDailyDose: 1500, unit: 'mg' },
      drugInteractions: [
        {
          interactingDrugCode: 'EFDA-MED-007',
          interactingDrugName: 'Theophylline',
          severity: 'Critical',
          mechanism: 'Ciprofloxacin potently inhibits CYP1A2, drastically decreasing theophylline clearance by up to 50% and precipitating life-threatening theophylline neurotoxicity and cardiac arrhythmias.',
          clinicalEvidence: 'ES 7084:2024 / EFDA Formulary Level 1 Flag. Theophylline serum level spikes dangerously within 48h.',
          riskScore: 0.92
        }
      ],
      unitPrice: 60.00
    },
    {
      drugCode: 'EFDA-MED-007',
      genericName: 'Theophylline',
      brandName: 'Theo-Dur',
      dosageForm: 'Tablet',
      strength: '300mg',
      strengthValue: 300,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Methylxanthine Bronchodilator',
      schedule: 'Prescription Only',
      standardDosageBounds: { minDailyDose: 200, maxDailyDose: 600, unit: 'mg' },
      unitPrice: 22.00
    },
    {
      drugCode: 'EFDA-MED-008',
      genericName: 'Azithromycin',
      brandName: 'Zithromax',
      dosageForm: 'Tablet',
      strength: '500mg',
      strengthValue: 500,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Macrolide Antibiotic',
      schedule: 'Prescription Only',
      standardDosageBounds: { minDailyDose: 250, maxDailyDose: 500, unit: 'mg' },
      unitPrice: 75.00
    },
    {
      drugCode: 'EFDA-MED-009',
      genericName: 'Metformin',
      brandName: 'Glucophage',
      dosageForm: 'Tablet',
      strength: '500mg',
      strengthValue: 500,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Biguanide Antidiabetic',
      schedule: 'Prescription Only',
      standardDosageBounds: { minDailyDose: 500, maxDailyDose: 2550, unit: 'mg' },
      unitPrice: 18.00
    },
    {
      drugCode: 'EFDA-MED-010',
      genericName: 'Metformin',
      brandName: 'Glucophage-Forte',
      dosageForm: 'Tablet',
      strength: '850mg',
      strengthValue: 850,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Biguanide Antidiabetic',
      schedule: 'Prescription Only',
      standardDosageBounds: { minDailyDose: 850, maxDailyDose: 2550, unit: 'mg' },
      unitPrice: 25.00
    },
    {
      drugCode: 'EFDA-MED-011',
      genericName: 'Paracetamol',
      brandName: 'Panadol Infant Syrup',
      dosageForm: 'Oral Syrup',
      strength: '120mg/5ml',
      strengthValue: 120,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Analgesic / Antipyretic',
      schedule: 'OTC',
      standardDosageBounds: { minDailyDose: 500, maxDailyDose: 4000, unit: 'mg' },
      pediatricDosing: { minAgeMonths: 2, mgPerKgPerDay: 60, maxDailyDose: 2000 },
      unitPrice: 35.00
    },
    {
      drugCode: 'EFDA-MED-012',
      genericName: 'Tramadol',
      brandName: 'Tradol',
      dosageForm: 'Capsule',
      strength: '50mg',
      strengthValue: 50,
      strengthUnit: 'mg',
      pharmacologicalClass: 'Opioid Analgesic',
      schedule: 'Controlled / Narcotic',
      standardDosageBounds: { minDailyDose: 50, maxDailyDose: 400, unit: 'mg' },
      unitPrice: 50.00
    }
  ];

  const savedDrugs = {};
  for (const d of drugsData) {
    const saved = await new Drug(d).save();
    savedDrugs[d.drugCode] = saved;
  }

  console.log('[RxGuard Seed] Seeding Patients...');
  const patientsData = [
    {
      patientId: 'PAT-2026-101',
      fullName: 'Yared Tadesse',
      age: 28,
      sex: 'Male',
      weight: 68,
      contactPhone: '+251 91 144 8822',
      nationalId: 'ET-NAT-84920492',
      allergies: [],
      chronicConditions: []
    },
    {
      patientId: 'PAT-2026-102',
      fullName: 'Almaz Bekele',
      age: 64,
      sex: 'Female',
      weight: 60,
      contactPhone: '+251 92 255 1199',
      nationalId: 'ET-NAT-55102948',
      allergies: [],
      chronicConditions: ['Active Peptic Ulcer', 'Hypertension']
    },
    {
      patientId: 'PAT-2026-103',
      fullName: 'Birtukan Desta',
      age: 52,
      sex: 'Female',
      weight: 72,
      contactPhone: '+251 91 388 4400',
      nationalId: 'ET-NAT-38829104',
      allergies: [],
      chronicConditions: ['Hyperlipidemia', 'Coronary Artery Disease']
    },
    {
      patientId: 'PAT-2026-104',
      fullName: 'Samuel Girma',
      age: 45,
      sex: 'Male',
      weight: 75,
      contactPhone: '+251 94 499 1234',
      nationalId: 'ET-NAT-77291038',
      allergies: [],
      chronicConditions: ['Asthma', 'COPD'],
      activeMedications: [{ drugName: 'Theophylline', dosage: '300mg daily', startDate: new Date('2026-01-10') }]
    },
    {
      patientId: 'PAT-2026-105',
      fullName: 'Selamawit Haile',
      age: 31,
      sex: 'Female',
      weight: 55,
      contactPhone: '+251 93 322 7788',
      nationalId: 'ET-NAT-12948201',
      allergies: ['Penicillin'],
      chronicConditions: []
    },
    {
      patientId: 'PAT-2026-106',
      fullName: 'Kirubel Yohannes',
      age: 5,
      sex: 'Male',
      weight: 18, // DEF-05: mandatory for < 12 yrs
      contactPhone: '+251 91 566 2211',
      nationalId: 'ET-NAT-99482013',
      allergies: [],
      chronicConditions: []
    }
  ];

  const savedPatients = {};
  for (const p of patientsData) {
    const saved = await new Patient(p).save();
    savedPatients[p.patientId] = saved;
  }

  console.log('[RxGuard Seed] Seeding Inventory Batches (FEFO & Barcodes)...');
  const now = new Date();
  const future14Months = new Date(now.getTime() + 420 * 24 * 60 * 60 * 1000);
  const future18Months = new Date(now.getTime() + 540 * 24 * 60 * 60 * 1000);
  const nearExpiry15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // For FR08 / DEF-01 test

  const batchesData = [
    {
      batchNumber: 'LOT-AMX-2026-A1',
      drugId: savedDrugs['EFDA-MED-001']._id,
      drugCode: 'EFDA-MED-001',
      drugName: 'Amoxicillin',
      strength: '500mg',
      dosageForm: 'Capsule',
      expiryDate: future14Months,
      stockOnHand: 450,
      shelfLocation: 'Shelf A-01 (Antibiotics)',
      barcode: '01003123456789011727091510AMOX50'
    },
    {
      batchNumber: 'LOT-WRF-2026-B2',
      drugId: savedDrugs['EFDA-MED-002']._id,
      drugCode: 'EFDA-MED-002',
      drugName: 'Warfarin',
      strength: '5mg',
      dosageForm: 'Tablet',
      expiryDate: future18Months,
      stockOnHand: 180,
      shelfLocation: 'Shelf C-03 (Cardiovascular/Anticoagulants)',
      barcode: '01003123456789011727091510WARF05'
    },
    {
      batchNumber: 'LOT-ASP-2026-C3',
      drugId: savedDrugs['EFDA-MED-003']._id,
      drugCode: 'EFDA-MED-003',
      drugName: 'Aspirin',
      strength: '100mg',
      dosageForm: 'Tablet',
      expiryDate: future14Months,
      stockOnHand: 600,
      shelfLocation: 'Shelf C-01 (Cardiovascular/Antiplatelets)',
      barcode: '01003123456789011727091510ASPR10'
    },
    {
      batchNumber: 'LOT-ATV-2026-D4',
      drugId: savedDrugs['EFDA-MED-004']._id,
      drugCode: 'EFDA-MED-004',
      drugName: 'Atorvastatin',
      strength: '40mg',
      dosageForm: 'Tablet',
      expiryDate: future18Months,
      stockOnHand: 220,
      shelfLocation: 'Shelf C-05 (Statins)',
      barcode: '01003123456789011727091510ATOR40'
    },
    {
      batchNumber: 'LOT-DLT-2026-E5',
      drugId: savedDrugs['EFDA-MED-005']._id,
      drugCode: 'EFDA-MED-005',
      drugName: 'Diltiazem',
      strength: '120mg',
      dosageForm: 'Tablet',
      expiryDate: future14Months,
      stockOnHand: 150,
      shelfLocation: 'Shelf C-07 (Calcium Channel Blockers)',
      barcode: '01003123456789011727091510DILT12'
    },
    {
      batchNumber: 'LOT-CIP-2026-F6',
      drugId: savedDrugs['EFDA-MED-006']._id,
      drugCode: 'EFDA-MED-006',
      drugName: 'Ciprofloxacin',
      strength: '500mg',
      dosageForm: 'Tablet',
      expiryDate: future14Months,
      stockOnHand: 190,
      shelfLocation: 'Shelf A-05 (Fluoroquinolones)',
      barcode: '01003123456789011727091510CIPR50'
    },
    {
      batchNumber: 'LOT-MET-2026-G7',
      drugId: savedDrugs['EFDA-MED-009']._id,
      drugCode: 'EFDA-MED-009',
      drugName: 'Metformin',
      strength: '500mg',
      dosageForm: 'Tablet',
      expiryDate: future18Months,
      stockOnHand: 400,
      shelfLocation: 'Shelf D-02 (Antidiabetic)',
      barcode: '01003123456789011727091510MET500' // Correct 500mg
    },
    {
      batchNumber: 'LOT-MET-2026-G8',
      drugId: savedDrugs['EFDA-MED-010']._id,
      drugCode: 'EFDA-MED-010',
      drugName: 'Metformin',
      strength: '850mg',
      dosageForm: 'Tablet',
      expiryDate: future18Months,
      stockOnHand: 300,
      shelfLocation: 'Shelf D-02 (Antidiabetic Forte)',
      barcode: '01003123456789011727091510MET850' // 850mg strength used to test barcode mismatch exception!
    },
    {
      batchNumber: 'LOT-PAR-2026-H9',
      drugId: savedDrugs['EFDA-MED-011']._id,
      drugCode: 'EFDA-MED-011',
      drugName: 'Paracetamol',
      strength: '120mg/5ml',
      dosageForm: 'Oral Syrup',
      expiryDate: future14Months,
      stockOnHand: 85,
      shelfLocation: 'Shelf B-01 (Pediatric Syrups)',
      barcode: '01003123456789011727091510BATCH01'
    },
    {
      // Near expiry batch to test FR08 / DEF-01 30-day block rule
      batchNumber: 'LOT-AMX-NEAR-EXPIRY',
      drugId: savedDrugs['EFDA-MED-001']._id,
      drugCode: 'EFDA-MED-001',
      drugName: 'Amoxicillin',
      strength: '500mg',
      dosageForm: 'Capsule',
      expiryDate: nearExpiry15Days,
      stockOnHand: 25,
      shelfLocation: 'Shelf A-01 (Quarantine/Near Expiry)',
      barcode: '01003123456789011727091510AMXNEAR',
      supervisoryReleaseAuthorized: false
    },
    {
      batchNumber: 'LOT-TRM-2026-T1',
      drugId: savedDrugs['EFDA-MED-012']._id,
      drugCode: 'EFDA-MED-012',
      drugName: 'Tramadol',
      strength: '50mg',
      dosageForm: 'Capsule',
      expiryDate: future18Months,
      stockOnHand: 350,
      shelfLocation: 'Shelf E-01 (Controlled Substances Lockbox)',
      barcode: '01003123456789011727091510TRAM50'
    },
    {
      batchNumber: 'LOT-AZM-2026-Z2',
      drugId: savedDrugs['EFDA-MED-008']._id,
      drugCode: 'EFDA-MED-008',
      drugName: 'Azithromycin',
      strength: '500mg',
      dosageForm: 'Tablet',
      expiryDate: future14Months,
      stockOnHand: 200,
      shelfLocation: 'Shelf A-03 (Macrolides)',
      barcode: '01003123456789011727091510AZIT50'
    },
    {
      batchNumber: 'LOT-THP-2026-P3',
      drugId: savedDrugs['EFDA-MED-007']._id,
      drugCode: 'EFDA-MED-007',
      drugName: 'Theophylline',
      strength: '300mg',
      dosageForm: 'Tablet',
      expiryDate: future18Months,
      stockOnHand: 140,
      shelfLocation: 'Shelf B-04 (Respiratory)',
      barcode: '01003123456789011727091510THEO30'
    }
  ];

  for (const b of batchesData) {
    await new BatchInventory(b).save();
  }

  console.log('[RxGuard Seed] Seeding Demonstrative Prescriptions matching SRS...');

  // Prescription 1: UC02 Scenario 1 Nominal (Amoxicillin 500mg, 28-yo, Clean risk score 0.02)
  const rx1 = new Prescription({
    prescriptionId: 'RX-2026-001001',
    patient: savedPatients['PAT-2026-101']._id,
    patientDemographicsSnapshot: savedPatients['PAT-2026-101'].toObject(),
    prescriber: {
      fullName: 'Dr. Senait Bekele',
      licenseNumber: 'ETH-MD-10924',
      facilityClinic: 'Bethel Health Center',
      contactNumber: '+251 91 100 2233',
      department: 'Internal Medicine'
    },
    prescriptionType: 'Acute',
    dateIssued: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    items: [{
      itemId: 'ITEM-001',
      drugId: savedDrugs['EFDA-MED-001']._id,
      drugCode: 'EFDA-MED-001',
      genericName: 'Amoxicillin',
      brandName: 'Moxatid',
      dosageForm: 'Capsule',
      strength: '500mg',
      doseQuantity: 500,
      doseUnit: 'mg',
      frequency: 'TID - 3 times daily',
      frequencyPerDay: 3,
      route: 'Oral',
      durationDays: 7,
      prescribedQuantity: 21,
      allocatedBatchNumber: 'LOT-AMX-2026-A1'
    }],
    totalPrice: 28.50 * 21
  });
  await rx1.save();
  const v1 = await evaluatePrescriptionSafety(rx1, savedPatients['PAT-2026-101']);
  rx1.clinicalRiskScore = v1.riskScore; // 0.02
  rx1.status = 'CLINICALLY_APPROVED';
  await rx1.save();

  // Prescription 2: UC02 Scenario 2 Exception (Warfarin 5mg + Aspirin 100mg with Ulcer, Critical Risk 0.94)
  const rx2 = new Prescription({
    prescriptionId: 'RX-2026-001002',
    patient: savedPatients['PAT-2026-102']._id,
    patientDemographicsSnapshot: savedPatients['PAT-2026-102'].toObject(),
    prescriber: {
      fullName: 'Dr. Tewodros Melaku',
      licenseNumber: 'ETH-MD-55821',
      facilityClinic: 'St. Paul Millennium Hospital',
      contactNumber: '+251 91 222 3344',
      department: 'Cardiology'
    },
    prescriptionType: 'Chronic',
    dateIssued: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    items: [
      {
        itemId: 'ITEM-002A',
        drugId: savedDrugs['EFDA-MED-002']._id,
        drugCode: 'EFDA-MED-002',
        genericName: 'Warfarin',
        brandName: 'Coumadin',
        dosageForm: 'Tablet',
        strength: '5mg',
        doseQuantity: 5,
        doseUnit: 'mg',
        frequency: 'QD - Once daily',
        frequencyPerDay: 1,
        route: 'Oral',
        durationDays: 30,
        prescribedQuantity: 30,
        allocatedBatchNumber: 'LOT-WRF-2026-B2'
      },
      {
        itemId: 'ITEM-002B',
        drugId: savedDrugs['EFDA-MED-003']._id,
        drugCode: 'EFDA-MED-003',
        genericName: 'Aspirin',
        brandName: 'Cardio-Aspirin',
        dosageForm: 'Tablet',
        strength: '100mg',
        doseQuantity: 100,
        doseUnit: 'mg',
        frequency: 'QD - Once daily',
        frequencyPerDay: 1,
        route: 'Oral',
        durationDays: 30,
        prescribedQuantity: 30,
        allocatedBatchNumber: 'LOT-ASP-2026-C3'
      }
    ],
    totalPrice: (15.00 * 30) + (8.50 * 30)
  });
  await rx2.save();
  const v2 = await evaluatePrescriptionSafety(rx2, savedPatients['PAT-2026-102']);
  const alertIds2 = [];
  for (const alt of v2.alerts) {
    const a = await new SafetyAlert(alt).save();
    alertIds2.push(a._id);
  }
  rx2.clinicalRiskScore = v2.riskScore;
  rx2.status = v2.status; // FLAGGED_HIGH_RISK
  rx2.safetyAlerts = alertIds2;
  await rx2.save();

  // Prescription 3: UC03 Scenario 1 Moderate Interaction (Atorvastatin 40mg + Diltiazem 120mg)
  const rx3 = new Prescription({
    prescriptionId: 'RX-2026-001003',
    patient: savedPatients['PAT-2026-103']._id,
    patientDemographicsSnapshot: savedPatients['PAT-2026-103'].toObject(),
    prescriber: {
      fullName: 'Dr. Girma Hailu',
      licenseNumber: 'ETH-MD-33012',
      facilityClinic: 'Bethel Specialized Clinic',
      contactNumber: '+251 91 333 4455',
      department: 'Internal Medicine'
    },
    prescriptionType: 'Chronic',
    dateIssued: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    items: [
      {
        itemId: 'ITEM-003A',
        drugId: savedDrugs['EFDA-MED-004']._id,
        drugCode: 'EFDA-MED-004',
        genericName: 'Atorvastatin',
        brandName: 'Lipitor',
        dosageForm: 'Tablet',
        strength: '40mg',
        doseQuantity: 40,
        doseUnit: 'mg',
        frequency: 'QD - Once daily',
        frequencyPerDay: 1,
        route: 'Oral',
        durationDays: 30,
        prescribedQuantity: 30,
        allocatedBatchNumber: 'LOT-ATV-2026-D4'
      },
      {
        itemId: 'ITEM-003B',
        drugId: savedDrugs['EFDA-MED-005']._id,
        drugCode: 'EFDA-MED-005',
        genericName: 'Diltiazem',
        brandName: 'Cardizem',
        dosageForm: 'Tablet',
        strength: '120mg',
        doseQuantity: 120,
        doseUnit: 'mg',
        frequency: 'BID - Twice daily',
        frequencyPerDay: 2,
        route: 'Oral',
        durationDays: 30,
        prescribedQuantity: 60,
        allocatedBatchNumber: 'LOT-DLT-2026-E5'
      }
    ],
    totalPrice: (45.00 * 30) + (32.00 * 60)
  });
  await rx3.save();
  const v3 = await evaluatePrescriptionSafety(rx3, savedPatients['PAT-2026-103']);
  const alertIds3 = [];
  for (const alt of v3.alerts) {
    const a = await new SafetyAlert(alt).save();
    alertIds3.push(a._id);
  }
  rx3.clinicalRiskScore = v3.riskScore;
  rx3.status = v3.status; // UNDER_CLINICAL_REVIEW
  rx3.safetyAlerts = alertIds3;
  await rx3.save();

  // Prescription 4: Ready for Dispensing & Barcode Verification (Metformin 500mg)
  const rx4 = new Prescription({
    prescriptionId: 'RX-2026-001004',
    patient: savedPatients['PAT-2026-101']._id,
    patientDemographicsSnapshot: savedPatients['PAT-2026-101'].toObject(),
    prescriber: {
      fullName: 'Dr. Senait Bekele',
      licenseNumber: 'ETH-MD-10924',
      facilityClinic: 'Bethel Health Center',
      contactNumber: '+251 91 100 2233',
      department: 'Outpatient'
    },
    prescriptionType: 'Chronic',
    dateIssued: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    items: [{
      itemId: 'ITEM-004',
      drugId: savedDrugs['EFDA-MED-009']._id,
      drugCode: 'EFDA-MED-009',
      genericName: 'Metformin',
      brandName: 'Glucophage',
      dosageForm: 'Tablet',
      strength: '500mg',
      doseQuantity: 500,
      doseUnit: 'mg',
      frequency: 'BID - Twice daily',
      frequencyPerDay: 2,
      route: 'Oral',
      durationDays: 30,
      prescribedQuantity: 60,
      allocatedBatchNumber: 'LOT-MET-2026-G7'
    }],
    totalPrice: 18.00 * 60,
    status: 'CLINICALLY_APPROVED',
    clinicalRiskScore: 0.02
  });
  await rx4.save();

  console.log('[RxGuard Seed] Seeding completed successfully!');
}

module.exports = { seedDatabase };
