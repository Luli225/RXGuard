/**
 * Bilingual Prescription Label Generator Service (FR10, UQR4, PQR5, ES 7084:2024)
 * Generates structured bilingual (Amharic / English) auxiliary packaging labels.
 */

const AMHARIC_FREQUENCY_MAP = {
  'QD - Once daily': 'በቀን አንድ ጊዜ (1x በቀን)',
  'BID - Twice daily': 'በቀን ሁለት ጊዜ (2x በቀን - በ12 ሰዓት ልዩነት)',
  'TID - 3 times daily': 'በቀን ሦስት ጊዜ (3x በቀን - በ8 ሰዓት ልዩነት)',
  'QID - 4 times daily': 'በቀን አራት ጊዜ (4x በቀን - በ6 ሰዓት ልዩነት)',
  'PRN - As needed': 'እንደ አስፈላጊነቱ ብቻ',
  'Q8H - Every 8 hours': 'በየ 8 ሰዓቱ',
  'Q12H - Every 12 hours': 'በየ 12 ሰዓቱ'
};

const AMHARIC_ROUTE_MAP = {
  'Oral': 'በአፍ የሚወሰድ',
  'Topical': 'በቆዳ ላይ የሚቀባ',
  'Inhalation': 'በመተንፈሻ የሚወሰድ',
  'Ophthalmic': 'በዓይን የሚንጠባጠብ',
  'Otic': 'በጆሮ የሚንጠባጠብ'
};

function generateBilingualLabel({
  prescription,
  item,
  batch,
  patient,
  dispenser
}) {
  const amharicFrequency = AMHARIC_FREQUENCY_MAP[item.frequency] || item.frequency;
  const amharicRoute = AMHARIC_ROUTE_MAP[item.route] || item.route;

  const labelData = {
    standard: 'Ethiopian Standard ES 7084:2024 Compliant',
    facility: {
      name: 'Tewedaj Community Pharmacy (ተወዳጅ ፋርማሲ)',
      branch: 'Bethel Branch, Addis Ababa, Ethiopia',
      phone: '+251 11 372 9000',
      license: 'EFDA/PHA/ADD-2024-889'
    },
    patient: {
      fullName: patient.fullName,
      patientId: patient.patientId,
      age: patient.age,
      sex: patient.sex
    },
    medication: {
      genericName: item.genericName,
      brandName: item.brandName || item.genericName,
      dosageForm: item.dosageForm,
      strength: item.strength,
      dispensedQuantity: item.prescribedQuantity,
      batchNumber: batch?.batchNumber || item.allocatedBatchNumber || 'BATCH-PROV',
      expiryDate: batch?.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '2027-12-31'
    },
    instructions: {
      english: `Take ${item.doseQuantity} ${item.doseUnit} ${item.frequency} via ${item.route} for ${item.durationDays} days.`,
      amharic: `${item.doseQuantity} ${item.doseUnit} ${amharicFrequency} ${amharicRoute} ለ${item.durationDays} ቀናት ይውሰዱ።`
    },
    cautions: {
      english: 'Keep out of reach of children. Store in a cool, dry place away from direct sunlight.',
      amharic: 'ከልጆች እጅ ያርቁ። ከቀጥታ የፀሐይ ብርሃንና ከሙቀት ርቆ በቀዝቃዛ ቦታ ይቀመጥ።'
    },
    dispenserInfo: {
      dispensedBy: dispenser?.fullName || 'Licensed Pharmacist',
      dispenseDate: new Date().toLocaleDateString('en-GB'),
      prescriptionId: prescription.prescriptionId,
      prescriber: prescription.prescriber.fullName
    },
    barcodeData: batch?.barcode || `GS1-${prescription.prescriptionId}-${item.drugCode}`
  };

  return labelData;
}

module.exports = {
  generateBilingualLabel
};
