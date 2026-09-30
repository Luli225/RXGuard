const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { proxyModel } = require('./modelProxy');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Pharmacist', 'Technician', 'Administrator'], 
    default: 'Pharmacist' 
  },
  licenseNumber: { type: String, default: '' },
  pinCode: { type: String, default: '1234' },
  failedLoginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockUntil: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const schemaMethods = {
  async comparePassword(candidatePassword) {
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      return await bcrypt.compare(candidatePassword, this.password);
    }
    return candidatePassword === this.password;
  },
  verifyPin(pin) {
    return String(this.pinCode) === String(pin);
  }
};

userSchema.methods.comparePassword = schemaMethods.comparePassword;
userSchema.methods.verifyPin = schemaMethods.verifyPin;

const MongooseUser = mongoose.model('User', userSchema);
module.exports = proxyModel('User', MongooseUser, schemaMethods);
