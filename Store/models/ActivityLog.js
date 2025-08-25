const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['task_created', 'task_updated', 'task_moved', 'task_deleted', 'task_assigned']
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  taskTitle: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  previousStatus: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done'],
    default: null
  },
  newStatus: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done'],
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String,
    default: ''
  }
});

activityLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
