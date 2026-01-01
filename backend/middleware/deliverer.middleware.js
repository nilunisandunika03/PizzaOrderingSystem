const requireDeliverer = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized. Please login.' });
    }

    try {
        const User = require('../database/models/User');
        const user = await User.findById(req.session.userId).select('role');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Allow both deliverers and admins
        if (user.role !== 'deliverer' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Deliverer privileges required.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Deliverer middleware error:', error);
        res.status(500).json({ message: 'Authorization error' });
    }
};

module.exports = { requireDeliverer };
