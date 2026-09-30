require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const { seedDatabase } = require('./seed/seedData');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const dispenseRoutes = require('./routes/dispenseRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const auditRoutes = require('./routes/auditRoutes');
const regulatoryRoutes = require('./routes/regulatoryRoutes');
const fhirRoutes = require('./routes/fhirRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/dispense', dispenseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/regulatory', regulatoryRoutes);

// HL7 FHIR Standard Endpoint (Section 4.7 External Interface UC01)
app.use('/fhir/R4', fhirRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'RxGuard Clinical Verification & Dispensing Engine',
    standard: 'Ethiopian Standard ES 7084:2024 / EFDA Compliant',
    uptimeSeconds: process.uptime(),
    timestamp: new Date()
  });
});

// Seed endpoint for quick reset or testing from UI / Postman
app.post('/api/seed-reset', async (req, res, next) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database reset and re-seeded with demo records' });
  } catch (e) {
    next(e);
  }
});

// Serve frontend build if present
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/fhir')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) next();
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await connectDB();

    // Auto-seed if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[RxGuard Server] Empty database detected. Running initial seed...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` RxGuard Backend Engine active on port: ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
      console.log(` HL7 FHIR R4:  http://localhost:${PORT}/fhir/R4/MedicationRequest`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[RxGuard Server] Failed to initialize:', err);
    process.exit(1);
  }
}

startServer();
