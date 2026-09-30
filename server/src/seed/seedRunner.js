require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const { seedDatabase } = require('./seedData');

async function run() {
  try {
    await connectDB();
    await seedDatabase();
    console.log('[RxGuard Seed Runner] Done.');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[RxGuard Seed Runner] Error:', err);
    process.exit(1);
  }
}

run();
