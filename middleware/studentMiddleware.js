module.exports = (req, res, next) => {
    if (req.session?.user?.role === 'Student') {
        return next();
    }

    return res.status(403).render('403', {
        message: 'Access denied. This area is restricted to students.'
    });
};
