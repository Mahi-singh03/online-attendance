// models/groupChat.js
import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Staff', 'Admin']
  },
  senderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'readBy.userModel'
    },
    userModel: {
      type: String,
      enum: ['Staff', 'Admin']
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 90 * 24 * 60 * 60 // Auto-delete after 90 days (3 months)
  }
});

// Index for better query performance
groupMessageSchema.index({ createdAt: 1 });
groupMessageSchema.index({ 'readBy.user': 1 });

// Method to mark message as read by a user
groupMessageSchema.methods.markAsRead = function(userId, userModel) {
  const alreadyRead = this.readBy.some(read => 
    read.user.toString() === userId.toString() && read.userModel === userModel
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      userModel: userModel,
      readAt: new Date()
    });
  }
  return this.save();
};

// Static method to get unread count for a user
groupMessageSchema.statics.getUnreadCount = function(userId, userModel) {
  return this.countDocuments({
    'readBy.user': { $ne: userId },
    'readBy.userModel': { $ne: userModel }
  });
};

export default mongoose.models.GroupMessage || mongoose.model('GroupMessage', groupMessageSchema);