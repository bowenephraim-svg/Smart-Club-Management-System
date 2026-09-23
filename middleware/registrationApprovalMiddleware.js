module.exports = function registrationApprovalMiddleware(
    req,
    res,
    next
) {

    if (
        !req.session ||
        !req.session.user
    ) {

        return res.redirect(
            '/auth/login'
        );

    }


    if (
        req.session.user.role !==
        'Patron'
    ) {

        return res.status(403).render(
            '404',
            {
                message:
                    'Access denied. Only Patrons can approve student registrations.'
            }
        );

    }


    next();

};