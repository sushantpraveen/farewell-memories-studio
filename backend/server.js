import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';
import compression from 'compression';
import passport from 'passport';

// Routes
import userRoutes from './routes/userRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Passport config
import { configurePassport } from './config/passport.js';
import User from './models/userModel.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000; // Changed to 4000 to avoid conflict

// Middleware
// CORS configuration
const frontendUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
console.log(`Setting up CORS for frontend URL: ${frontendUrl}`);

app.use(cors({
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Allow preflight requests
app.options('*', cors());

// Initialize Passport
configurePassport();
app.use(passport.initialize());

// Increase Node.js memory limits for handling large payloads
const maxRequestSize = '10mb'; // Reduced from 50mb to avoid memory issues
app.use(express.json({ limit: maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: maxRequestSize }));

// Add compression to reduce payload sizes
app.use(compression());

// Add timeout handling
app.use((req, res, next) => {
  res.setTimeout(60000, () => {
    console.log('Request has timed out.');
    res.status(408).send('Request timeout');
  });
  next();
});

app.use(morgan('dev'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/signatureday')
  .then(async () => {
    console.log('MongoDB connected successfully');
    // Ensure an admin user exists
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      const adminName = process.env.ADMIN_NAME || 'Administrator';

      if (adminEmail && adminPassword) {
        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
          admin = await User.create({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            isAdmin: true,
            isLeader: true
          });
          console.log(`Admin user created: ${adminEmail}`);
        } else if (!admin.isAdmin) {
          admin.isAdmin = true;
          await admin.save();
          console.log(`Existing user promoted to admin: ${adminEmail}`);
        }
      } else {
        console.warn('ADMIN_EMAIL and/or ADMIN_PASSWORD not set. Skipping admin seeding.');
      }
    } catch (seedErr) {
      console.error('Failed to ensure admin user:', seedErr);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
