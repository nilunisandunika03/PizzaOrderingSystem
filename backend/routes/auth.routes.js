const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');
const otpGenerator = require('otp-generator');
const { body, validationResult } = require('express-validator');
const User = require('../database/models/User');
const { sendEmail } = require('../utils/email');
const { isAuthenticated } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// --- Helper Functions ---
const generateOTP = () => otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

// --- Rate Limiters ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { message: 'Too many attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Requirement: 5 attempts / 15 min
    message: { message: 'Too many login attempts, please try again after 15 minutes' },
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
    req.session.captcha = captcha.text;
    res.status(200).json({ svg: captcha.data });
});

// 1.1 Verify CAPTCHA (Generic)
router.post('/verify-captcha', (req, res) => {
    const { captcha } = req.body;
    if (!req.session.captcha || req.session.captcha.toLowerCase() !== captcha.toLowerCase()) {
        return res.status(400).json({ message: 'Invalid CAPTCHA' });
    }
    // We don't clear it here so it can be used for the next step if immediate, 
    // but usually we should clear it. For generic "are you human" checks, clearing is safer.
    req.session.captcha = null;
    res.status(200).json({ message: 'CAPTCHA verified' });
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

    try {
        if (!req.session.captcha || req.session.captcha.toLowerCase() !== captcha.toLowerCase()) {
            return res.status(400).json({ message: 'Invalid CAPTCHA' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const verification_token = crypto.randomBytes(32).toString('hex');
        const verification_token_expires = Date.now() + 3600000;

        const userData = {
            email,
            password_hash: password,
            full_name: fullName,
            verification_token,
            verification_token_expires,
            role: 'customer'
        };

        if (address) {
            userData.address = address;
        }

        await User.create(userData);


        req.session.captcha = null;

        const verifyLink = `http://localhost:5173/verify-email?token=${verification_token}`;
        // Logs removed for security
        await sendEmail(email, 'Verify your email', `
            <h3>Welcome to Appppp!</h3>
            <p>Please click the link below to verify your email address (expires in 1 hour):</p>
            <a href="${verifyLink}">Verify Email</a>
        `);

        res.status(201).json({ message: 'Registration successful. Please check your email for verification.' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});


router.post('/verify-email', authLimiter, async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Missing token' });

    try {
        const user = await User.findOne({
            verification_token: token,
            verification_token_expires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        user.is_verified = true;
        user.verification_token = null;
        user.verification_token_expires = null;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully. You can now login.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during verification' });
    }
});


router.post('/login', loginLimiter, [
    body('email').isEmail(),
    body('password').notEmpty(),
    body('captcha').notEmpty()
], async (req, res) => {
    const { email, password, captcha } = req.body;

    try {
        console.log(`[Login Attempt] Email: ${email}, Captcha Provided: ${captcha}, Session Captcha: ${req.session.captcha}`);

        if (!req.session.captcha || req.session.captcha.toLowerCase() !== captcha.toLowerCase()) {
            console.log('[Login Fail] Invalid CAPTCHA');
            return res.status(400).json({ message: 'Invalid CAPTCHA' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log('[Login Fail] User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }


        if (user.lock_until && user.lock_until > Date.now()) {
            return res.status(403).json({
                message: `Account locked due to multiple failed attempts. Try again later.`
            });
        }


        if (!user.is_verified) {
            console.log('[Login Fail] User not verified');
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            console.log('[Login Fail] Password mismatch');
            user.failed_login_attempts += 1;
            if (user.failed_login_attempts >= 5) {
                user.lock_until = Date.now() + 15 * 60 * 1000;
            }
            await user.save();
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        user.failed_login_attempts = 0;
        user.lock_until = null;

        const otp = generateOTP();
        user.mfa_secret = otp;
        await user.save();

        // Clear captcha only on successful credentials and OTP generation
        req.session.captcha = null;

        await sendEmail(user.email, 'Your Login OTP', `<p>Your verification code is: <strong>${otp}</strong></p>`);
        // Logs removed for security
        req.session.preAuthUserId = user._id;

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
        const user = await User.findById(userId);
        if (!user) return res.status(401).json({ message: 'User not found' });

        if (user.mfa_secret !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        req.session.regenerate(async (err) => {
            if (err) return res.status(500).json({ message: 'Session error' });

            req.session.userId = user._id;
            user.mfa_secret = null;
            user.last_login = new Date();
            await user.save();

            res.status(200).json({
                message: 'Login successful',
                user: {
                    id: user._id,
                    fullName: user.full_name,
                    email: user.email,
                    role: user.role,
                    is_verified: user.is_verified,
                    address: user.address,
                    savedCards: user.savedCards
                }
            });
        });

    } catch (error) {
        console.error('OTP Verification Error:', error);
        res.status(500).json({ message: 'Verification error' });
    }
});


router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Logout failed' });
        res.clearCookie('sessionId');
        res.json({ message: 'Logged out successfully' });
    });
});


router.get('/me', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('full_name email is_verified address role savedCards');
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
});


router.put('/profile', isAuthenticated, [
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { fullName, address } = req.body;

        if (fullName) user.full_name = fullName;
        if (address !== undefined) user.address = address;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
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
