const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'shree_aura_cottons_enterprise_jwt_secret_key_2026_@v2';

/**
 * Middleware to strictly verify Admin JWT authorization token.
 * Checks HTTP-Only cookie 'admin_token' or 'Authorization: Bearer <token>' header.
 */
function verifyAdminToken(req, res, next) {
    let token = null;

    // 1. Extract token from Cookie if present
    if (req.cookies && req.cookies.admin_token) {
        token = req.cookies.admin_token;
    } 
    // 2. Extract token from Authorization header if present
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Access Denied: Missing authentication token. Please log in as administrator.' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Enforce strict Role-Based Access Control (RBAC)
        if (!decoded || decoded.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Forbidden: You do not have administrator permissions to access customer data.' 
            });
        }

        req.admin = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Session expired. Please log in again.' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid authentication token. Authorization failed.' 
        });
    }
}

module.exports = {
    verifyAdminToken,
    JWT_SECRET
};
