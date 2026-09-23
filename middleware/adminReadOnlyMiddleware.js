module.exports = (req, res, next) => {

    console.log(
        'ADMIN READ ONLY:',
        req.method,
        req.path,
        req.session?.user?.role
    );

    // Only apply read-only restrictions to Admin users.
    // Patrons, Students and other roles continue normally.
    if (req.session?.user?.role !== 'Admin') {
        return next();
    }

    // ==========================================
    // ALLOWED ADMIN ACTIONS
    // ==========================================
    // An administrator may maintain a personal profile image and create a
    // patron account. All club, membership, finance, and school-configuration
    // data remains read-only.

    const allowedAdminActions = [

        // Admin profile image
        {
            method: 'POST',
            path: '/admin/profile/image'
        },

        // Patron onboarding is the one administrative management action.
        {
            method: 'GET',
            path: '/patrons/add'
        },
        {
            method: 'POST',
            path: '/patrons/add'
        }

    ];


    // ==========================================
    // CHECK ALLOWED ACTIONS
    // ==========================================

    const isAllowedAction = allowedAdminActions.some(action => {

        return (
            req.method === action.method &&
            req.path === action.path
        );

    });


    if (isAllowedAction) {
        return next();
    }


    // ==========================================
    // ADMIN READ-ONLY PROTECTION
    // ==========================================

    // Block all other non-GET/HEAD requests.
    if (
        req.method !== 'GET' &&
        req.method !== 'HEAD'
    ) {

        return res.status(403).render('403', {

            message:
                'Administrators have read-only access.'

        });

    }


    // ==========================================
    // BLOCK ACTION-STYLE GET ROUTES
    // ==========================================
    // Prevent URLs such as:
    // /students/add
    // /patrons/edit/5
    // /clubs/delete/2
    // /memberships/remove/4

    const actionPath =
        /\/(add|edit|delete|approve|reject|create|update|remove)(\/|$)/i;


    if (actionPath.test(req.path)) {

        return res.status(403).render('403', {

            message:
                'Administrators have read-only access.'

        });

    }


    // Everything else is allowed.
    return next();

};

