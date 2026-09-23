module.exports = (req, res, next) => {
    const role = req.session?.user?.role;
    if (role === 'Admin' || role === 'Patron' || role === 'Teacher') {
        return next();
    }

    return res.status(403).render('403', {
        message: 'Access denied. Finance is available to authorized staff only.'
    });
};
