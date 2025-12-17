import express from 'express';
import session from 'express-session';
import cors from 'cors';
import svgCaptcha from 'svg-captcha';
import { openDb } from './db.js';
import bcrypt from 'bcrypt';

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // React app
    credentials: true
}));
app.use(express.json());

app.use(session({
    secret: 'pizza-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true }
}));

// Initialize database and users table
async function initDb() {
    const db = await openDb();

    // Create users table if it doesn't exist
    await db.exec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);

    // Insert a test user
    const hashedPassword = await bcrypt.hash('123456', 10);
    await db.run(
        `INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)`,
        ['test@pizza.com', hashedPassword]
    );

    console.log('Database initialized ✅');
}

initDb();

// Test route
app.get('/', (req, res) => {
    res.send('Backend is running 🍕');
});

// CAPTCHA route
app.get('/api/auth/captcha', (req, res) => {
    const captcha = svgCaptcha.create({
        size: 5,
        noise: 2,
        color: true,
        background: '#f4f4f4'
    });

    req.session.captcha = captcha.text.toLowerCase();
    res.type('svg');
    res.send(captcha.data);
});

// Login route
app.post('/api/auth/login', async (req, res) => {
    const { email, password, captcha } = req.body;

    // 1️⃣ Validate CAPTCHA
    if (!captcha || captcha.toLowerCase() !== req.session.captcha) {
        return res.status(400).json({ message: 'Invalid CAPTCHA' });
    }

    req.session.captcha = null; // clear CAPTCHA

    // 2️⃣ Get user from database
    const db = await openDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    // 3️⃣ Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(400).json({ message: 'Wrong password' });
    }

    // 4️⃣ Generate dummy OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    req.session.otp = otp;

    console.log('Dummy OTP for user:', otp); // For testing

    res.json({ message: 'Login successful. OTP sent.' });
});

// OTP verification route
app.post('/api/auth/verify-otp', (req, res) => {
    const { otp } = req.body;

    if (!otp || otp != req.session.otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    req.session.otp = null; // clear OTP

    res.json({ message: 'OTP verified! Login complete.' });
});

// Start server
app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});
