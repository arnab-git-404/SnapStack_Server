const mongoose = require('mongoose');

const coupleSchema = new mongoose.Schema({
  user1: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  user2: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: String,
    email: String,
    joinedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  inviteToken: {
    type: String,
    unique: true,
    sparse: true
  },
  inviteExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
coupleSchema.index({ 'user1.userId': 1 });
coupleSchema.index({ 'user2.userId': 1 });
coupleSchema.index({ inviteToken: 1 });

module.exports = mongoose.model('Couple', coupleSchema);