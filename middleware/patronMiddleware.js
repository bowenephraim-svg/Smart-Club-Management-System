const db = require('../config/db');

module.exports = async function patronMiddleware(
    req,
    res,
    next
) {

    try {

        // ------------------------------------------
        // Must be logged in
        // ------------------------------------------

        if (
            !req.session ||
            !req.session.user
        ) {

            return res.redirect(
                '/auth/login'
            );

        }


        const user =
            req.session.user;


        // ------------------------------------------
        // Patron only
        // ------------------------------------------

        if (
            user.role !== 'Patron'
        ) {

            return res.status(403).render(
                '403',
                {
                    message:
                        'Access denied. This area is restricted to Patrons only.'
                }
            );

        }


        // ------------------------------------------
        // Find Patron profile
        // ------------------------------------------

        const [rows] =
            await db.query(
                `
                SELECT
                    p.patron_id,
                    p.user_id,
                    p.full_name,
                    p.email,
                    p.phone,
                    p.department,
                    u.profile_image

                FROM patrons p

                LEFT JOIN users u
                    ON u.user_id = p.user_id

                WHERE p.user_id = ? OR (p.email IS NOT NULL AND LOWER(p.email) = LOWER(?))

                LIMIT 1
                `,
                [user.id, user.email || '']
            );


        // ------------------------------------------
        // No profile
        // ------------------------------------------

        if (
            !rows ||
            rows.length === 0
        ) {

            req.patron = {

                patron_id: null,

                user_id: user.id,

                full_name:
                    user.full_name ||
                    user.name ||
                    'Patron',

                email:
                    user.email,

                phone: null,

                department: null,

                profile_image: user.profile_image || null

            };

        } else {

            if (!rows[0].user_id && user.id) {
                await db.query(`UPDATE patrons SET user_id = ? WHERE patron_id = ?`, [user.id, rows[0].patron_id]);
                rows[0].user_id = user.id;
            }

            // A legacy patron record can be linked during this request. Keep
            // the uploaded session image available immediately in that case.
            rows[0].profile_image = rows[0].profile_image || user.profile_image || null;

            req.patron =
                rows[0];

            if (req.session?.user) {
                req.session.user.patron_id = rows[0].patron_id;
            }

        }


        return next();


    } catch (err) {

        console.error(
            'patronMiddleware error:',
            err
        );

        return res.status(500).render(
            '500',
            {
                error: err
            }
        );

    }

};
