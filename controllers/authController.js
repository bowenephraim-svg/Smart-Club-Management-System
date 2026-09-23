const User = require('../models/User');
const Student = require('../models/Student');

const renderLoginError = (res, error) => res.status(401).render('auth/login', {
    error,
    error_msg: error,
    success: null
});

const statusError = (status) => {
    switch (status) {
        case 'Approved':
        case null:
        case undefined:
        case '':
            return null;
        case 'Pending Payment':
            return 'Your account is awaiting payment confirmation.';
        case 'Pending Approval':
        case 'Pending':
            return 'Your account is still pending approval.';
        case 'Rejected':
            return 'Your account has been rejected. Please contact the administrator.';
        default:
            return 'Your account is not currently approved. Please contact the administrator.';
    }
};

const regenerateSession = (req) => new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
});

const AUTHENTICATED_ROLES = new Set([
    'Admin',
    'Patron',
    'Student'
]);

module.exports = {
    renderLogin: (req, res) => {
        res.render('auth/login', { error: null, error_msg: null, success: null });
    },

    processLogin: async (req, res) => {
        try {
            const email = (req.body.email || '').trim().toLowerCase();
            const password = req.body.password || '';

            if (!email || !password) {
                return renderLoginError(res, 'Please enter your email and password.');
            }

            // loginMode is only a UI choice. The database credentials determine role.
           const user = await User.findByEmail(email);

if (!user || !(await User.verifyPassword(password, user.password))) {
    return renderLoginError(res, 'Invalid email or password.');
}

if (!AUTHENTICATED_ROLES.has(user.role)) {
    console.error(`Login rejected: unsupported role for user_id ${user.user_id}`);
    return renderLoginError(
        res,
        'Your account role is not recognized. Please contact the administrator.'
    );
}

let student;

if (user.role === 'Student') {
    const accountError = statusError(user.status);

    if (accountError) {
        return renderLoginError(res, accountError);
    }
}

if (user.role === 'Student') {
    student = await Student.getByUserId(user.user_id);

    if (!student) {
        console.error(`Student login rejected: no profile for user_id ${user.user_id}`);
        return renderLoginError(
            res,
            'Your student profile could not be found. Please contact the administrator.'
        );
    }
}

            // Regenerate only after a successful authentication to prevent session fixation.
            await regenerateSession(req);
            req.session.userId = user.user_id;
            req.session.role = user.role;
            req.session.user = {
                id: user.user_id,
                user_id: user.user_id,
                full_name: user.full_name,
                name: user.full_name,
                email: user.email,
                role: user.role,
                status: user.status,
                profile_image: user.profile_image || null
            };

            if (student) {
                req.session.user.student_id = student.student_id;
                req.session.user.admission_no = student.admission_no;
            }

            if (user.role === 'Patron') {
                const [patronRows] = await require('../config/db').query(
                    `SELECT patron_id FROM patrons WHERE user_id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?)) LIMIT 1`,
                    [user.user_id, user.email || '']
                );
                if (patronRows.length > 0) {
                    req.session.user.patron_id = patronRows[0].patron_id;
                }
            }

            switch (user.role) {
    case 'Admin':
    return res.redirect('/admin/dashboard');

    case 'Patron':
    return res.redirect('/patron/dashboard');

    case 'Student':
    return res.redirect('/student/dashboard');
   
}
        } catch (err) {
            console.error('Login error:', err);
            return res.status(500).render('auth/login', {
                error: 'An unexpected error occurred while logging in. Please try again.',
                error_msg: 'An unexpected error occurred while logging in. Please try again.',
                success: null
            });
        }
    },

    processLogout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            res.clearCookie('connect.sid');
            res.redirect('/auth/login');
        });
    }
};
