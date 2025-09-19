// models/Staff.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const staffSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'staff'
  },
  allowedIps: [{
    type: String,
    default: []
  }]
}, {
  timestamps: true
});

staffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

staffSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Staff = mongoose.models.Staff || mongoose.model('Staff', staffSchema);
export default Staff;