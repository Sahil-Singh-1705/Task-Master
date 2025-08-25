const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://sahil:sahil@cluster0.dltjxpq.mongodb.net/crud";

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`);
  next();
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['member', 'admin'], default: 'member' },
});

const userModel = mongoose.model('User', userSchema);

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
});

const taskModel = mongoose.model('Task', taskSchema);
const notificationModel = require('./models/Notification');

app.post('/api/signup',
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(password, 10);
      } catch (hashError) {
        console.error('Error hashing password:', hashError);
        return res.status(500).json({ message: 'Error processing password' });
      }

      const newUser = new userModel({ name, email, password: hashedPassword, role: 'member' });
      try {
        await newUser.save();
      } catch (saveError) {
        console.error('Error saving user:', saveError);
        return res.status(500).json({ message: 'Error saving user' });
      }

      console.log(`New user created: ${email} with role: member`);

      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

app.post('/api/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, role: user.role, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description, dueDate, status, assignedTo, priority } = req.body;
  if (!title || !description || !dueDate) {
    return res.status(400).json({ message: 'Title, description, and dueDate are required' });
  }
  try {
    const newTask = new taskModel({
      title,
      description,
      dueDate: new Date(dueDate),
      status: status || 'To Do',
      assignedTo: assignedTo || null,
      priority: priority || 'Medium',
    });
    await newTask.save();
    
    const user = await userModel.findById(req.user.userId);
    const userName = user ? user.name : 'System';
    
    const notification = new notificationModel({
      userId: req.user.userId,
      userName: userName,
      taskId: newTask._id,
      taskTitle: newTask.title,
      action: 'created',
      message: `${userName} created new task "${newTask.title}"`,
      timestamp: new Date()
    });
    await notification.save();

    io.emit('notification', {
      _id: notification._id,
      userId: notification.userId,
      userName: notification.userName,
      taskId: notification.taskId,
      taskTitle: notification.taskTitle,
      action: notification.action,
      message: notification.message,
      timestamp: notification.timestamp,
      read: notification.read
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error saving task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await taskModel.find().populate('assignedTo', 'name email').sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, status, assignedTo, priority, userId, userName } = req.body;
  
  if (!title || !description || !dueDate) {
    return res.status(400).json({ message: 'Title, description, and dueDate are required' });
  }
  
  try {
    const oldTask = await taskModel.findById(id);
    if (!oldTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatedTask = await taskModel.findByIdAndUpdate(
      id,
      { title, description, dueDate: new Date(dueDate), status, assignedTo, priority },
      { new: true }
    ).populate('assignedTo', 'name email');
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (oldTask.status !== status || oldTask.assignedTo?.toString() !== assignedTo) {
      const user = await userModel.findById(userId || req.user?.userId);
      const userNameDisplay = userName || user?.name || 'Unknown User';
      
      let notificationMessage = '';
      if (oldTask.status !== status) {
        notificationMessage = `${userNameDisplay} moved "${oldTask.title}" from "${oldTask.status}" to "${status}"`;
      } else if (oldTask.assignedTo?.toString() !== assignedTo) {
        const assignedUser = await userModel.findById(assignedTo);
        const assignedUserName = assignedUser?.name || 'Unassigned';
        notificationMessage = `${userNameDisplay} assigned "${oldTask.title}" to ${assignedUserName}`;
      }

      if (notificationMessage) {
        const notification = new notificationModel({
          userId: userId || req.user?.userId,
          userName: userNameDisplay,
          taskId: id,
          taskTitle: oldTask.title,
          action: 'moved',
          fromStatus: oldTask.status,
          toStatus: status,
          message: notificationMessage,
          timestamp: new Date()
        });
        await notification.save();

        io.emit('notification', {
          _id: notification._id,
          userId: notification.userId,
          userName: notification.userName,
          taskId: notification.taskId,
          taskTitle: notification.taskTitle,
          action: notification.action,
          fromStatus: notification.fromStatus,
          toStatus: notification.toStatus,
          message: notification.message,
          timestamp: notification.timestamp,
          read: notification.read
        });
      }
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, userName } = req.body;
  
  try {
    const deletedTask = await taskModel.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const notification = new notificationModel({
      userId: userId || req.user?.userId,
      userName: userName || 'System',
      taskId: id,
      taskTitle: deletedTask.title,
      action: 'deleted',
      message: `${userName || 'System'} deleted task "${deletedTask.title}"`,
      timestamp: new Date()
    });
    await notification.save();

    io.emit('notification', {
      _id: notification._id,
      userId: notification.userId,
      userName: notification.userName,
      taskId: notification.taskId,
      taskTitle: notification.taskTitle,
      action: notification.action,
      message: notification.message,
      timestamp: notification.timestamp,
      read: notification.read
    });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId).select('name email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existingUser = await userModel.findOne({ email, _id: { $ne: req.user.userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use by another account' });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true }
    ).select('name email role');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await userModel.find().select('name email role');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await notificationModel.find()
      .populate('userId', 'name email')
      .populate('taskId', 'title')
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { taskId, taskTitle, action, fromStatus, toStatus, message } = req.body;
    
    const notification = new notificationModel({
      userId: req.user.userId,
      userName: req.user.name || 'Unknown User',
      taskId,
      taskTitle,
      action,
      fromStatus,
      toStatus,
      message,
      timestamp: new Date()
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationModel.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotification = await notificationModel.findByIdAndDelete(id);
    
    if (!deletedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

server.listen(port, () => {
  console.log(`Express app running at http://localhost:${port}/`);
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
