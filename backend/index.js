require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const { connectDB } = require('./database/database');
const path = require('path');



// Connect to MongoDB
// Removed top-level call to prevent race condition
// connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(mongoSanitize()); // Prevention against NoSQL injection
app.use(cookieParser());
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
    next();
});
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' })); // Body parser with limit
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    console.error('FATAL: SESSION_SECRET environment variable is not set. Please configure it before running the server.');
    process.exit(1);
}

const MongoStore = require('connect-mongo').default;

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // Ensured session is created early for CAPTCHA
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    name: 'sessionId', // Custom cookie name
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // Prevents XSS-based cookie theft
        sameSite: 'lax', // Relaxed for cross-port development (localhost:5173 to localhost:3001)
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        path: '/'
    }
}));

// Placeholder route
app.get('/', (req, res) => {
    res.json({
        message: 'Pizza Ordering System API v1.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            categories: '/api/categories',
            cart: '/api/cart',
            orders: '/api/orders',
            payments: '/api/payments'
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    const logger = require('./utils/logger');
    logger.error('Unhandled error', { error: err.message, stack: err.stack });

    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production'
            ? 'An error occurred'
            : err.message
    });
});

// Import and use routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database. Server not started.', error);
        process.exit(1);
    }
};

startServer();
