const express = require('express');
const router = express.Router();
const { getPatients, getPatientById, createPatient, updatePatient } = require('../controllers/patientController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getPatients);
router.get('/:id', optionalAuth, getPatientById);
router.post('/', optionalAuth, createPatient);
router.put('/:id', optionalAuth, updatePatient);

module.exports = router;
