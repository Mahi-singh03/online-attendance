import mongoose from 'mongoose';

const staffAttendanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Staff reference is required'],
    index: true
  },
  loginTime: {
    type: Date,
    required: [true, 'Login time is required'],
    default: Date.now
  },
  logoutTime: {
    type: Date
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  sessionDuration: {
    type: Number, // in minutes
    min: 0
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'forced-logout', 'system-logout'],
      message: 'Status must be active, completed, forced-logout, or system-logout'
    },
    default: 'active'
  },
  autoDeleteDate: {
    type: Date,
    required: true,
    index: true
  },
  monthYear: {
    type: String, // Format: "YYYY-MM" for easy querying
    required: true,
    index: true
  },
  retentionStatus: {
    type: String,
    enum: ['active', 'scheduled-for-deletion', 'deleted'],
    default: 'active'
  },
  location: {
    country: String,
    city: String,
    timezone: String
  },
  deviceInfo: {
    browser: String,
    os: String,
    deviceType: String // mobile, tablet, desktop
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
staffAttendanceSchema.index({ staff: 1, loginTime: -1 });
staffAttendanceSchema.index({ autoDeleteDate: 1 });
staffAttendanceSchema.index({ monthYear: 1 });
staffAttendanceSchema.index({ loginTime: -1 });
staffAttendanceSchema.index({ status: 1 });
staffAttendanceSchema.index({ 'deviceInfo.deviceType': 1 });
staffAttendanceSchema.index({ 'location.country': 1 });
staffAttendanceSchema.index({ staff: 1, status: 1 });

// Virtual for checking if session is active
staffAttendanceSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.logoutTime;
});

// Virtual for checking if record should be deleted
staffAttendanceSchema.virtual('shouldBeDeleted').get(function() {
  return new Date() >= this.autoDeleteDate && this.retentionStatus === 'active';
});

// Virtual for formatted session duration
staffAttendanceSchema.virtual('formattedDuration').get(function() {
  if (!this.sessionDuration) return null;
  
  const hours = Math.floor(this.sessionDuration / 60);
  const minutes = this.sessionDuration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for session duration in hours (decimal)
staffAttendanceSchema.virtual('durationHours').get(function() {
  if (!this.sessionDuration) return null;
  return (this.sessionDuration / 60).toFixed(2);
});

// Virtual for days until auto-deletion
staffAttendanceSchema.virtual('daysUntilDeletion').get(function() {
  const now = new Date();
  const diffTime = this.autoDeleteDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for login date (without time)
staffAttendanceSchema.virtual('loginDate').get(function() {
  return this.loginTime.toISOString().split('T')[0];
});

// Pre-save middleware to set autoDeleteDate and monthYear
staffAttendanceSchema.pre('save', function(next) {
  if (this.isNew) {
    // Set auto deletion date to 15th of the month, 3 months from now
    const deleteDate = new Date(this.loginTime);
    deleteDate.setMonth(deleteDate.getMonth() + 3);
    deleteDate.setDate(15); // Set to 15th of the month
    deleteDate.setHours(23, 59, 59, 999); // End of day
    
    this.autoDeleteDate = deleteDate;
    
    // Set monthYear for easy querying (format: YYYY-MM)
    const year = this.loginTime.getFullYear();
    const month = String(this.loginTime.getMonth() + 1).padStart(2, '0');
    this.monthYear = `${year}-${month}`;
    
    // Initialize deviceInfo object and extract device info from userAgent
    if (!this.deviceInfo) {
      this.deviceInfo = {};
    }
    this.extractDeviceInfo();
  }
  
  // Calculate session duration when logout time is set
  if (this.isModified('logoutTime') && this.logoutTime) {
    const loginTime = this.loginTime.getTime();
    const logoutTime = this.logoutTime.getTime();
    this.sessionDuration = Math.round((logoutTime - loginTime) / (1000 * 60)); // Convert to minutes
    
    // Auto-complete status if still active
    if (this.status === 'active') {
      this.status = 'completed';
    }
  }
  
  next();
});

// Method to extract device information from userAgent
staffAttendanceSchema.methods.extractDeviceInfo = function() {
  if (!this.userAgent) return;
  
  const ua = this.userAgent.toLowerCase();
  
  // Browser detection
  if (ua.includes('chrome') && !ua.includes('edg')) this.deviceInfo.browser = 'Chrome';
  else if (ua.includes('firefox')) this.deviceInfo.browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) this.deviceInfo.browser = 'Safari';
  else if (ua.includes('edg')) this.deviceInfo.browser = 'Edge';
  else if (ua.includes('opera')) this.deviceInfo.browser = 'Opera';
  else this.deviceInfo.browser = 'Other';
  
  // OS detection
  if (ua.includes('windows')) this.deviceInfo.os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) this.deviceInfo.os = 'MacOS';
  else if (ua.includes('linux')) this.deviceInfo.os = 'Linux';
  else if (ua.includes('android')) this.deviceInfo.os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone')) this.deviceInfo.os = 'iOS';
  else this.deviceInfo.os = 'Other';
  
  // Device type detection
  if (ua.includes('mobile')) this.deviceInfo.deviceType = 'mobile';
  else if (ua.includes('tablet')) this.deviceInfo.deviceType = 'tablet';
  else this.deviceInfo.deviceType = 'desktop';
};

// Method to log logout
staffAttendanceSchema.methods.logLogout = function(logoutTime = new Date(), status = 'completed', reason = '') {
  this.logoutTime = logoutTime;
  this.status = status;
  
  // Recalculate session duration
  const loginTime = this.loginTime.getTime();
  const logoutTimeMs = logoutTime.getTime();
  this.sessionDuration = Math.round((logoutTimeMs - loginTime) / (1000 * 60));
  
  if (reason) {
    this.notes = reason;
  }
};

// Method to force logout (for admin actions)
staffAttendanceSchema.methods.forceLogout = function(reason = 'Admin forced logout') {
  this.logoutTime = new Date();
  this.status = 'forced-logout';
  this.notes = reason;
  
  const loginTime = this.loginTime.getTime();
  const logoutTimeMs = this.logoutTime.getTime();
  this.sessionDuration = Math.round((logoutTimeMs - loginTime) / (1000 * 60));
};

// Method to mark as system logout (for auto-cleanup)
staffAttendanceSchema.methods.systemLogout = function(reason = 'System auto-logout') {
  this.logoutTime = new Date();
  this.status = 'system-logout';
  this.notes = reason;
  
  const loginTime = this.loginTime.getTime();
  const logoutTimeMs = this.logoutTime.getTime();
  this.sessionDuration = Math.round((logoutTimeMs - loginTime) / (1000 * 60));
};

// Method to update location information
staffAttendanceSchema.methods.updateLocation = function(locationData) {
  if (!this.location) {
    this.location = {};
  }
  if (locationData.country) this.location.country = locationData.country;
  if (locationData.city) this.location.city = locationData.city;
  if (locationData.timezone) this.location.timezone = locationData.timezone;
};

// Method to check if session is longer than specified hours
staffAttendanceSchema.methods.isLongerThan = function(hours) {
  if (!this.sessionDuration) return false;
  return this.sessionDuration > (hours * 60);
};

// Method to get session summary
staffAttendanceSchema.methods.getSessionSummary = function() {
  return {
    id: this._id,
    staff: this.staff,
    loginTime: this.loginTime,
    logoutTime: this.logoutTime,
    duration: this.sessionDuration,
    formattedDuration: this.formattedDuration,
    status: this.status,
    ipAddress: this.ipAddress,
    device: this.deviceInfo,
    location: this.location
  };
};

// Static method to get active sessions
staffAttendanceSchema.statics.getActiveSessions = function(staffId = null) {
  const query = { 
    status: 'active',
    logoutTime: { $exists: false }
  };
  
  if (staffId) {
    query.staff = staffId;
  }
  
  return this.find(query)
    .populate('staff', 'name email')
    .sort({ loginTime: -1 })
    .exec();
};

// Static method to get attendance by staff with pagination
staffAttendanceSchema.statics.getAttendanceByStaff = function(staffId, page = 1, limit = 30, monthYear = null) {
  const skip = (page - 1) * limit;
  const query = { staff: staffId };
  
  if (monthYear) {
    query.monthYear = monthYear;
  }
  
  return this.find(query)
    .sort({ loginTime: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

// Static method to get attendance summary by month
staffAttendanceSchema.statics.getMonthlySummary = function(staffId, year, month) {
  const monthYear = `${year}-${String(month).padStart(2, '0')}`;
  
  return this.aggregate([
    {
      $match: {
        staff: new mongoose.Types.ObjectId(staffId),
        monthYear: monthYear
      }
    },
    {
      $group: {
        _id: '$staff',
        totalSessions: { $sum: 1 },
        totalDuration: { $sum: '$sessionDuration' },
        averageDuration: { $avg: '$sessionDuration' },
        firstLogin: { $min: '$loginTime' },
        lastLogout: { $max: '$logoutTime' },
        completedSessions: {
          $sum: {
            $cond: [{ $in: ['$status', ['completed', 'forced-logout']] }, 1, 0]
          }
        },
        systemLogouts: {
          $sum: {
            $cond: [{ $eq: ['$status', 'system-logout'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Static method to get daily attendance summary
staffAttendanceSchema.statics.getDailySummary = function(staffId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        staff: new mongoose.Types.ObjectId(staffId),
        loginTime: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$loginTime' } },
        totalSessions: { $sum: 1 },
        totalDuration: { $sum: '$sessionDuration' },
        sessions: {
          $push: {
            loginTime: '$loginTime',
            logoutTime: '$logoutTime',
            duration: '$sessionDuration',
            status: '$status',
            ipAddress: '$ipAddress'
          }
        }
      }
    }
  ]);
};

// Static method to auto-delete old records (runs monthly)
staffAttendanceSchema.statics.autoDeleteOldRecords = async function() {
  const now = new Date();
  
  // Find records scheduled for deletion
  const recordsToDelete = await this.find({
    autoDeleteDate: { $lte: now },
    retentionStatus: 'active'
  }).populate('staff', 'name email');
  
  const deleteResult = await this.deleteMany({
    autoDeleteDate: { $lte: now },
    retentionStatus: 'active'
  });
  
  // Mark records as deleted (optional: for audit trail)
  await this.updateMany(
    {
      autoDeleteDate: { $lte: now },
      retentionStatus: 'active'
    },
    {
      $set: { retentionStatus: 'deleted' }
    }
  );
  
  return {
    deletedCount: deleteResult.deletedCount,
    records: recordsToDelete
  };
};

// Static method to get deletion schedule
staffAttendanceSchema.statics.getDeletionSchedule = function() {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);
  nextMonth.setDate(15);
  
  return this.find({
    autoDeleteDate: { $lte: nextMonth },
    retentionStatus: 'active'
  })
  .populate('staff', 'name email')
  .sort({ autoDeleteDate: 1 })
  .exec();
};

// Static method to cleanup incomplete sessions (older than 24 hours)
staffAttendanceSchema.statics.cleanupIncompleteSessions = async function() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const incompleteSessions = await this.find({
    status: 'active',
    loginTime: { $lt: twentyFourHoursAgo },
    logoutTime: { $exists: false }
  });
  
  for (const session of incompleteSessions) {
    session.systemLogout('Auto-logout due to 24-hour inactivity');
    await session.save();
  }
  
  return incompleteSessions.length;
};

// Static method to get staff attendance statistics
staffAttendanceSchema.statics.getStaffStats = function(staffId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        staff: new mongoose.Types.ObjectId(staffId),
        loginTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$staff',
        totalSessions: { $sum: 1 },
        totalDuration: { $sum: '$sessionDuration' },
        averageDuration: { $avg: '$sessionDuration' },
        uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$loginTime' } } },
        mostUsedBrowser: { $max: '$deviceInfo.browser' },
        mostUsedDevice: { $max: '$deviceInfo.deviceType' }
      }
    },
    {
      $project: {
        totalSessions: 1,
        totalDuration: 1,
        averageDuration: 1,
        uniqueDays: { $size: '$uniqueDays' },
        mostUsedBrowser: 1,
        mostUsedDevice: 1,
        averageDailyDuration: { $divide: ['$totalDuration', { $size: '$uniqueDays' }] }
      }
    }
  ]);
};

// Static method to find duplicate sessions (same staff, same day)
staffAttendanceSchema.statics.findDuplicateSessions = function(staffId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    staff: staffId,
    loginTime: { $gte: startOfDay, $lte: endOfDay }
  })
  .sort({ loginTime: 1 })
  .exec();
};

// Ensure virtual fields are serialized
staffAttendanceSchema.set('toJSON', { virtuals: true });
staffAttendanceSchema.set('toObject', { virtuals: true });

const StaffAttendance = mongoose.models.StaffAttendance || mongoose.model('StaffAttendance', staffAttendanceSchema);
export default StaffAttendance;