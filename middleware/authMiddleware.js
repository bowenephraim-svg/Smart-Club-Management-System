// middleware/authMiddleware.js
module.exports = function protectRoute(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/auth/login');
};