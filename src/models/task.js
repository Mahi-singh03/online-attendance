// models/Task.js
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Task title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [1000, 'Task description cannot exceed 1000 characters']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Staff assignment is required']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Admin assigner is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'in-progress', 'completed', 'rejected', 'cancelled'],
      message: 'Status must be pending, in-progress, completed, rejected, or cancelled'
    },
    default: 'pending'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be low, medium, high, or urgent'
    },
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  completedAt: {
    type: Date
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'rejected', 'cancelled']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'statusHistory.userType'
    },
    userType: {
      type: String,
      enum: ['Admin', 'Staff']
    },
    note: {
      type: String,
      maxlength: 200
    }
  }],
  retentionPeriod: {
    type: String,
    enum: ['grace-period', 'completed-storage', 'permanent'],
    default: 'grace-period'
  },
  scheduledDeletionDate: {
    type: Date
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'attachments.uploadedByType'
    },
    uploadedByType: {
      type: String,
      enum: ['Admin', 'Staff']
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'comments.userType',
      required: true
    },
    userType: {
      type: String,
      enum: ['Admin', 'Staff'],
      required: true
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  }],
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  estimatedHours: {
    type: Number,
    min: 0,
    max: 500
  },
  actualHours: {
    type: Number,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ retentionPeriod: 1 });
taskSchema.index({ scheduledDeletionDate: 1 });
taskSchema.index({ completedAt: 1 });
taskSchema.index({ createdAt: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ 'statusHistory.changedAt': 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && !['completed', 'cancelled', 'rejected'].includes(this.status);
});

// Virtual for task duration in days
taskSchema.virtual('durationDays').get(function() {
  if (this.completedAt && this.createdAt) {
    return Math.ceil((this.completedAt - this.createdAt) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual to check if task should be auto-deleted (3 months after completion)
taskSchema.virtual('shouldBeDeleted').get(function() {
  if (this.scheduledDeletionDate) {
    return new Date() >= this.scheduledDeletionDate;
  }
  return false;
});

// Virtual to check if task is in grace period (first 3 months)
taskSchema.virtual('isInGracePeriod').get(function() {
  if (this.retentionPeriod === 'grace-period') {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return this.createdAt >= threeMonthsAgo;
  }
  return false;
});

// Virtual for days until deletion
taskSchema.virtual('daysUntilDeletion').get(function() {
  if (this.scheduledDeletionDate) {
    const now = new Date();
    const diffTime = this.scheduledDeletionDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Pre-save middleware to handle retention logic
taskSchema.pre('save', function(next) {
  // Set grace period for new tasks
  if (this.isNew) {
    this.retentionPeriod = 'grace-period';
    
    // Add initial status to history
    this.statusHistory.push({
      status: 'pending',
      changedAt: this.createdAt,
      changedBy: this.assignedBy,
      userType: 'Admin',
      note: 'Task created'
    });
  }
  
  // Handle status changes
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this.assignedTo, // Default to assigned staff, can be overridden
      userType: 'Staff',
      note: `Status changed to ${this.status}`
    });
    
    // Handle completed tasks retention
    if (this.status === 'completed' && !this.scheduledDeletionDate) {
      this.retentionPeriod = 'completed-storage';
      this.completedAt = new Date();
      this.setScheduledDeletionDate();
    }
    
    // Handle non-completed tasks after grace period
    if (this.status !== 'completed' && this.isGracePeriodOver()) {
      this.retentionPeriod = 'permanent';
    }
  }
  
  // Update retention period if grace period is over
  if (this.retentionPeriod === 'grace-period' && this.isGracePeriodOver()) {
    if (this.status === 'completed') {
      this.retentionPeriod = 'completed-storage';
      this.setScheduledDeletionDate();
    } else {
      this.retentionPeriod = 'permanent';
    }
  }
  
  if (this.isModified('dueDate') && this.dueDate <= new Date()) {
    return next(new Error('Due date must be in the future'));
  }
  
  next();
});

// Method to set scheduled deletion date (15th of the month, 3 months after completion)
taskSchema.methods.setScheduledDeletionDate = function() {
  if (!this.completedAt) return;
  
  const deletionDate = new Date(this.completedAt);
  deletionDate.setMonth(deletionDate.getMonth() + 3);
  
  // Set to 15th of the month
  if (deletionDate.getDate() > 15) {
    deletionDate.setMonth(deletionDate.getMonth() + 1);
  }
  deletionDate.setDate(15);
  deletionDate.setHours(23, 59, 59, 999); // End of day
  
  this.scheduledDeletionDate = deletionDate;
};

// Method to check if grace period is over (3 months from creation)
taskSchema.methods.isGracePeriodOver = function() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return this.createdAt < threeMonthsAgo;
};

// Method to update progress
taskSchema.methods.updateProgress = function(progress, comment, userId, userType = 'Staff') {
  const oldProgress = this.progress;
  this.progress = Math.max(0, Math.min(100, progress));
  
  // Add progress comment
  if (comment) {
    this.comments.push({
      user: userId,
      userType: userType,
      comment: `Progress updated from ${oldProgress}% to ${progress}%: ${comment}`,
      createdAt: new Date()
    });
  } else {
    this.comments.push({
      user: userId,
      userType: userType,
      comment: `Progress updated from ${oldProgress}% to ${progress}%`,
      isSystem: true,
      createdAt: new Date()
    });
  }
  
  // Auto-update status based on progress
  if (progress === 100 && this.status !== 'completed') {
    this.markAsCompleted(userId, userType);
  } else if (progress > 0 && progress < 100 && this.status === 'pending') {
    this.updateStatus('in-progress', userId, userType, 'Progress started');
  }
};

// Method to mark task as completed
taskSchema.methods.markAsCompleted = function(userId, userType = 'Staff', note = 'Task completed') {
  this.status = 'completed';
  this.progress = 100;
  this.completedAt = new Date();
  this.retentionPeriod = 'completed-storage';
  this.setScheduledDeletionDate();
  
  this.statusHistory.push({
    status: 'completed',
    changedAt: new Date(),
    changedBy: userId,
    userType: userType,
    note: note
  });
};

// Method to update status with history tracking
taskSchema.methods.updateStatus = function(newStatus, userId, userType = 'Staff', note = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: userId,
    userType: userType,
    note: note || `Status changed from ${oldStatus} to ${newStatus}`
  });
  
  // Handle completed status specifically
  if (newStatus === 'completed') {
    this.markAsCompleted(userId, userType, note);
  }
};

// Method to add comment
taskSchema.methods.addComment = function(userId, userType, comment) {
  this.comments.push({
    user: userId,
    userType: userType,
    comment: comment,
    createdAt: new Date()
  });
};

// Method to reject task
taskSchema.methods.rejectTask = function(reason, rejectedBy, note = 'Task rejected') {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.completedAt = new Date();
  this.retentionPeriod = 'permanent';
  
  this.statusHistory.push({
    status: 'rejected',
    changedAt: new Date(),
    changedBy: rejectedBy,
    userType: 'Admin',
    note: note
  });
  
  this.comments.push({
    user: rejectedBy,
    userType: 'Admin',
    comment: `Task rejected: ${reason}`
  });
};

// Method to add attachment
taskSchema.methods.addAttachment = function(fileInfo, userId, userType) {
  this.attachments.push({
    ...fileInfo,
    uploadedBy: userId,
    uploadedByType: userType,
    uploadedAt: new Date()
  });
};

// Static method to auto-delete old completed tasks (3 months retention)
taskSchema.statics.autoDeleteOldTasks = async function() {
  const now = new Date();
  
  const result = await this.deleteMany({
    scheduledDeletionDate: { $lte: now },
    retentionPeriod: 'completed-storage'
  });
  
  return result.deletedCount;
};

// Static method to update retention periods for tasks older than 3 months
taskSchema.statics.updateRetentionPeriods = async function() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  // Update tasks older than 3 months that are still in grace period
  const updateResult = await this.updateMany({
    createdAt: { $lt: threeMonthsAgo },
    retentionPeriod: 'grace-period'
  }, {
    $set: { 
      retentionPeriod: 'permanent'
    }
  });
  
  // Set deletion dates for completed tasks that don't have one
  const deletionUpdateResult = await this.updateMany({
    status: 'completed',
    scheduledDeletionDate: { $exists: false },
    completedAt: { $exists: true }
  }, {
    $set: {
      retentionPeriod: 'completed-storage'
    }
  });
  
  // Set scheduled deletion dates for completed tasks
  const tasksToUpdate = await this.find({
    status: 'completed',
    scheduledDeletionDate: { $exists: false },
    completedAt: { $exists: true }
  });
  
  for (const task of tasksToUpdate) {
    task.setScheduledDeletionDate();
    await task.save();
  }
  
  return {
    gracePeriodUpdated: updateResult.modifiedCount,
    deletionDatesSet: tasksToUpdate.length
  };
};

// Static method to get tasks scheduled for deletion
taskSchema.statics.getTasksScheduledForDeletion = function() {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  return this.find({
    scheduledDeletionDate: { $lte: nextMonth },
    retentionPeriod: 'completed-storage'
  })
  .populate('assignedTo', 'name email')
  .populate('assignedBy', 'name email')
  .sort({ scheduledDeletionDate: 1 })
  .exec();
};

// Static method to get tasks by staff with retention filtering
taskSchema.statics.getTasksByStaff = function(staffId, page = 1, limit = 10, includeCompleted = true) {
  const skip = (page - 1) * limit;
  const query = { assignedTo: staffId };
  
  if (!includeCompleted) {
    query.status = { $ne: 'completed' };
  }
  
  // Exclude tasks scheduled for deletion
  query.$or = [
    { retentionPeriod: { $ne: 'completed-storage' } },
    { 
      retentionPeriod: 'completed-storage',
      scheduledDeletionDate: { $gt: new Date() }
    }
  ];
  
  return this.find(query)
    .populate('assignedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $in: ['pending', 'in-progress'] },
    // Exclude tasks scheduled for deletion
    $or: [
      { retentionPeriod: { $ne: 'completed-storage' } },
      { 
        retentionPeriod: 'completed-storage',
        scheduledDeletionDate: { $gt: new Date() }
      }
    ]
  })
  .populate('assignedTo', 'name email')
  .populate('assignedBy', 'name email')
  .exec();
};

// Static method to get cleanup statistics
taskSchema.statics.getCleanupStats = function() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  return this.aggregate([
    {
      $facet: {
        scheduledForDeletion: [
          {
            $match: {
              retentionPeriod: 'completed-storage',
              scheduledDeletionDate: { $lte: nextMonth }
            }
          },
          { $count: 'count' }
        ],
        gracePeriodTasks: [
          {
            $match: {
              retentionPeriod: 'grace-period',
              createdAt: { $gte: threeMonthsAgo }
            }
          },
          { $count: 'count' }
        ],
        permanentTasks: [
          { $match: { retentionPeriod: 'permanent' } },
          { $count: 'count' }
        ],
        completedTasks: [
          { $match: { status: 'completed' } },
          { $count: 'count' }
        ]
      }
    }
  ]);
};

// Ensure virtual fields are serialized
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task;