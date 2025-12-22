const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password_hash: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: true
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    verification_token: {
        type: String,
        default: null
    },
    verification_token_expires: {
        type: Date,
        default: null
    },
    mfa_secret: {
        type: String,
        default: null
    },
    mfa_enabled: {
        type: Boolean,
        default: false
    },
    last_login: {
        type: Date,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    failed_login_attempts: {
        type: Number,
        default: 0
    },
    lock_until: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'deliverer'],
        default: 'customer'
    }
}, {
    timestamps: true
});

// Hash password before saving if it's new or modified
userSchema.pre('save', async function () {
    if (!this.isModified('password_hash')) return;
    this.password_hash = await argon2.hash(this.password_hash, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1
    });
});

// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await argon2.verify(this.password_hash, candidatePassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
