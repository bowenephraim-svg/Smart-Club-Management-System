module.exports = (req, res, next) => {
    const role = req.session?.user?.role || req.session?.role;

    if (['admin', 'patron'].includes(String(role).trim().toLowerCase())) {
        return next();
    }

    return res.status(403).render('403', {
        message: 'You do not have permission to manage this content.'
    });
};
