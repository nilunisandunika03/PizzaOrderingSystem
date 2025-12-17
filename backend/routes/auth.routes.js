const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const svgCaptcha = require('svg-captcha');
const otpGenerator = require('otp-generator');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const rateLimit = require('express-rate-limit');

// --- Helper Functions ---
const generateOTP = () => otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

// --- Rate Limiters ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: { message: 'Too many attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per window
    message: { message: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- Routes ---

// 1. Get CAPTCHA
router.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.create({
        size: 6,
        noise: 2,
        color: true,
        background: '#cc9966'
    });
    // Store captcha text in session for validation
    req.session.captcha = captcha.text;
    res.type('svg');
    res.status(200).send(captcha.data);
});

// 2. Register
router.post('/register', authLimiter, [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('captcha').notEmpty().withMessage('Captcha is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, captcha, address } = req.body;

    // Validate Captcha
    if (!req.session.captcha || req.session.captcha.toLowerCase() !== captcha.toLowerCase()) {
        return res.status(400).json({ message: 'Invalid CAPTCHA' });
    }
    // Clear captcha immediately after use
    req.session.captcha = null;

    try {
        // Check existing user
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash Password
        const saltRounds = 12; // Secure salt rounds
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Generate Verification Token
        const verification_token = require('crypto').randomBytes(32).toString('hex');

        // Create User
        await User.create({
            email,
            password_hash,
            full_name: fullName,
            verification_token,
            address
        });

        // Send Verification Email
        const verifyLink = `http://localhost:5173/verify-email?token=${verification_token}`;
        await sendEmail(email, 'Verify your email', `
            <h3>Welcome to Appppp!</h3>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verifyLink}">Verify Email</a>
        `);

        res.status(201).json({ message: 'Registration successful. Please check your email for verification.' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// 3. Verify Email
router.post('/verify-email', authLimiter, async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Missing token' });

    try {
        const user = await User.findOne({ where: { verification_token: token } });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        user.is_verified = true;
        user.verification_token = null; // Clear token
        await user.save();

        res.status(200).json({ message: 'Email verified successfully. You can now login.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during verification' });
    }
});

// 4. Login Step 1: Validate Credentials & Send OTP
router.post('/login', loginLimiter, [
    body('email').isEmail(),
    body('password').notEmpty(),
    // body('captcha').notEmpty() // Allow bypassing captcha for easier testing if needed
], async (req, res) => {
    const { email, password, captcha } = req.body;

    // Enforce Captcha on Login as per requirements
    if (!req.session.captcha || req.session.captcha.toLowerCase() !== captcha.toLowerCase()) {
        return res.status(400).json({ message: 'Invalid CAPTCHA' });
    }
    req.session.captcha = null;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        if (!user.is_verified) return res.status(401).json({ message: 'Please verify your email first' });

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        // Generate OTP
        const otp = generateOTP();

        user.mfa_secret = otp;
        await user.save();

        // Send OTP via Email
        await sendEmail(user.email, 'Your Login OTP', `<p>Your verification code is: <strong>${otp}</strong></p>`);

        // Store pre-auth user ID in session temporarily
        req.session.preAuthUserId = user.id;

        res.status(200).json({ message: 'OTP sent to email', requireMfa: true });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Login error' });
    }
});

// 5. Verify OTP & Finalize Login
router.post('/verify-otp', loginLimiter, async (req, res) => {
    const { otp } = req.body;
    const userId = req.session.preAuthUserId;

    if (!userId) return res.status(401).json({ message: 'Session expired. Please login again.' });

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(401).json({ message: 'User not found' });

        // Check OTP
        if (user.mfa_secret !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP is valid - Secure the session
        // Regenerate session to prevent fixation attacks
        req.session.regenerate(async (err) => {
            if (err) return res.status(500).json({ message: 'Session error' });

            // Set Authenticated Session
            req.session.userId = user.id;

            // Clear OTP
            user.mfa_secret = null;
            user.last_login = new Date();
            await user.save();

            res.status(200).json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email
                }
            });
        });

    } catch (error) {
        console.error('OTP Verification Error:', error);
        res.status(500).json({ message: 'Verification error' });
    }
});

// 6. Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Logout failed' });
        res.clearCookie('connect.sid'); // Default session cookie name
        res.json({ message: 'Logged out successfully' });
    });
});

// 7. Check Auth Status (for frontend init)
router.get('/me', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findByPk(req.session.userId, {
            attributes: ['id', 'full_name', 'email', 'is_verified', 'address']
        });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// 8. Update Profile
router.put('/profile', isAuthenticated, [
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
    // address is optional
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findByPk(req.session.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { fullName, address } = req.body;

        if (fullName) user.full_name = fullName;
        if (address !== undefined) user.address = address; // Allow empty string to clear address if needed

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                address: user.address,
                is_verified: user.is_verified
            }
        });
    } catch (error) {
        console.error('Profile Update Error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

module.exports = router;
