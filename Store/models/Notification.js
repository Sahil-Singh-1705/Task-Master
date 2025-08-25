const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  taskTitle: { type: String, required: true },
  action: { type: String, required: true }, // e.g., "moved", "created", "updated"
  fromStatus: { type: String },
  toStatus: { type: String },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const notificationModel = mongoose.model('Notification', notificationSchema);

module.exports = notificationModel;
