const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const { connectDB } = require('./database/database');
const path = require('path');

require('dotenv').config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(mongoSanitize()); // Prevention against NoSQL injection
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' })); // Body parser with limit
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'super_secure_secret_key_change_me',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // Custom cookie name
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // Prevents XSS-based cookie theft
        sameSite: 'strict', // Protects against CSRF
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        path: '/'
    }
}));

// Placeholder route
app.get('/', (req, res) => {
    res.json({ message: 'Secure Backend API is running' });
});

// Import and use routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
