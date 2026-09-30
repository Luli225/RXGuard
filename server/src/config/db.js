const mongoose = require('mongoose');
const { setMongoConnected } = require('./memoryStore');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rxguard';
  
  try {
    // Attempt standard connection with 1.5s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500
    });
    console.log(`[RxGuard DB] Successfully connected to MongoDB at: ${uri}`);
    setMongoConnected(true);
  } catch (err) {
    console.warn(`[RxGuard DB] Direct MongoDB connection to ${uri} not active (${err.message}).`);
    console.log('[RxGuard DB] Initializing high-speed In-Memory Database Engine (Zero setup mode)...');
    setMongoConnected(false);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore
  }
}

module.exports = { connectDB, disconnectDB };
