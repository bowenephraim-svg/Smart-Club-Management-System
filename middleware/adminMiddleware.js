// middleware/adminMiddleware.js
module.exports = (req, res, next) => {
    // Assumes authMiddleware has run first and attached role data to session state
    const role = req.session?.user?.role || req.session?.role;
    if (String(role).trim().toLowerCase() === 'admin') {
        return next();
    }

    // Insufficient clearance access level intercept. Send HTTP 403 Forbidden.
    res.status(403).render('403', {
        message: 'Access Denied: You do not have administrative permission.'
    });
};
