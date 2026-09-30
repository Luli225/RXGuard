const express = require('express');
const router = express.Router();
const { ingestFhirMedicationRequest } = require('../controllers/fhirController');

// POST /fhir/R4/MedicationRequest (Section 4.7 External Interface UC01)
router.post('/MedicationRequest', ingestFhirMedicationRequest);

module.exports = router;
