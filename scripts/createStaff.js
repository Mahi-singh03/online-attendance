const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Staff schema (same as in your model)
const staffSchema = new mongoose.Schema({
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

const Staff = mongoose.models.Staff || mongoose.model('Staff', staffSchema);

async function createStaff() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if staff already exists
    const existingStaff = await Staff.findOne({ email: 'staff@company.com' });
    if (existingStaff) {
      console.log('Staff user already exists');
      return;
    }

    // Create new staff member
    const staff = new Staff({
      name: 'Test Staff',
      email: 'staff@company.com',
      password: 'staff123', // This will be hashed by the pre-save middleware
      role: 'staff',
      allowedIps: [] // No IP restrictions for testing
    });

    await staff.save();
    console.log('Staff user created successfully:');
    console.log('Email: staff@company.com');
    console.log('Password: staff123');
    
  } catch (error) {
    console.error('Error creating staff:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createStaff();
