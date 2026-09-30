const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  logClarification
} = require('../controllers/prescriptionController');
const { optionalAuth, authenticate } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getPrescriptions);
router.get('/:id', optionalAuth, getPrescriptionById);
router.post('/', optionalAuth, createPrescription);
router.post('/:id/clarification', optionalAuth, logClarification);

module.exports = router;
