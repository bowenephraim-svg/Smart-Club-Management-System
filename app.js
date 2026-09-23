// app.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./config/db');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
// ===============================
// ROUTE IMPORTS
// ===============================
const protectRoute = require('./middleware/authMiddleware');
const verifyAdmin = require('./middleware/adminMiddleware');
const verifyFinanceAccess = require('./middleware/financeMiddleware');
const verifyPatron = require('./middleware/patronMiddleware');
const adminReadOnly = require('./middleware/adminReadOnlyMiddleware');
const profileUpload = require('./middleware/profileUploadMiddleware');
const profileController = require('./controllers/profileController');

const dashboardRoutes = require('./routes/dashboardRoutes');
const studentManagementRoutes = require('./routes/studentManagementRoutes');
const studentRegistrationRoutes = require('./routes/studentRegistrationRoutes');
const studentPaymentRoutes = require('./routes/studentPaymentRoutes');
const studentRoutes = require('./routes/studentRoutes');
const financeRoutes = require('./routes/financeRoutes');
const adminApprovalRoutes = require('./routes/adminApprovalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const electionRoutes = require('./routes/electionRoutes');
const eventRoutes = require('./routes/eventRoutes');
const Notification = require('./models/Notification');
const patronMiddleware = require('./middleware/patronMiddleware');




// ===============================
// MIDDLEWARE
// ===============================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// ===============================
// SESSION
// ===============================
app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            'victory_school_secret_key',

        resave: false,

        saveUninitialized: false,

      cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
}
    })
);

// ===============================
// GLOBAL VARIABLES
// ===============================
app.use(async (req, res, next) => {

    res.locals.user = req.session.user || null;

    // Flash messages from session
    res.locals.success_msg =
        req.session.success_msg || '';

    res.locals.error_msg =
        req.session.error_msg || '';

    delete req.session.success_msg;
    delete req.session.error_msg;

    // Load school settings for dynamic branding
    try {

        const [[settings]] =
            await db.query(`
                SELECT *
                FROM settings
                LIMIT 1
            `);

        res.locals.schoolSettings = settings || {
            school_name: 'Smart Club System',
            school_logo: null,
            school_motto: '',
            school_address: '',
            school_phone: '',
            school_email: '',
            school_website: '',
            academic_year: new Date().getFullYear().toString(),
            currency: 'KES',
            theme: 'Professional'
        };

    } catch (err) {

        console.error(
            'Failed to load school settings:',
            err.message
        );

        res.locals.schoolSettings = {
            school_name: 'Smart Club System',
            school_logo: null,
            school_motto: '',
            school_address: '',
            school_phone: '',
            school_email: '',
            school_website: '',
            academic_year: new Date().getFullYear().toString(),
            currency: 'KES',
            theme: 'Professional'
        };

    }

    // Load navbar notification data for the logged-in user
    if (req.session && req.session.user) {

        try {

            const userId = req.session.user.id;

            const [unreadCount, latestNotifications] = await Promise.all([
                Notification.unreadCount(userId),
                Notification.getLatestForUser(userId, 5)
            ]);

            res.locals.navbarUnreadCount = unreadCount;
            res.locals.navbarNotifications = latestNotifications;

        } catch (err) {

            console.error(
                'Failed to load navbar notifications:',
                err.message
            );

            res.locals.navbarUnreadCount = 0;
            res.locals.navbarNotifications = [];

        }

    } else {

        res.locals.navbarUnreadCount = 0;
        res.locals.navbarNotifications = [];

    }

    res.locals.currentPath = req.path;

    next();

});

// Keep profile images available for existing installations as well as fresh databases.
db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) NULL AFTER password')
    .catch(err => console.error('Profile image column check failed:', err.message));

// Admins monitor the system; patrons perform operational changes.
app.use(adminReadOnly);

// ===============================
// HOME PAGE
// ===============================
app.get('/', async (req, res) => {

    try {

        const [[clubCount]] =
            await db.query(
                "SELECT COUNT(*) AS total FROM clubs"
            );

        const [[membershipCount]] =
            await db.query(
                "SELECT COUNT(*) AS total FROM memberships"
            );

        const [[activityCount]] =
            await db.query(
                "SELECT COUNT(*) AS total FROM activities"
            );

        res.render('index', {

            totalClubs:
                clubCount.total || 0,

            totalMemberships:
                membershipCount.total || 0,

            totalActivities:
                activityCount.total || 0,

            satisfaction: 97

        });

    } catch (err) {

        console.error(err);

        res.render('index', {

            totalClubs: 0,

            totalMemberships: 0,

            totalActivities: 0,

            satisfaction: 97

        });

    }

});

// ===============================
// VERIFY STUDENT
// ===============================
app.post('/student/verify', async (req, res) => {

    try {

        const { admission_no } = req.body;

        const [rows] = await db.query(

            `
            SELECT *
            FROM students
            WHERE admission_no = ?
            `,

            [admission_no]

        );

        if (rows.length === 0) {

            return res.json({

                success: false,

                error: 'Student not found.'

            });

        }

        res.json({

            success: true,

            student: rows[0]

        });

    } catch (err) {

        console.error(err);

        res.json({

            success: false,

            error: err.message

        });

    }

});

// ===============================
// PUBLIC ROUTES
// ===============================

// Authentication
app.use('/auth', require('./routes/authRoutes'));

// Student Registration
app.use('/student', studentRegistrationRoutes);

// Student Payment
app.use('/student', studentPaymentRoutes);

// Student Dashboard & Profile
app.use('/student', studentRoutes);

// ===============================
// PROTECTED ROUTES
// ===============================

// Admin Dashboard
app.use(
    '/admin',
    protectRoute,
    verifyAdmin,
    dashboardRoutes
);

app.get('/admin/profile', protectRoute, verifyAdmin, profileController.adminProfile);
app.post('/admin/profile/image', protectRoute, verifyAdmin, profileUpload.single('profile_image'), profileController.uploadImage);

// Students
app.use(
    '/students',
    protectRoute,
    verifyAdmin,
    studentManagementRoutes
);

// Clubs
app.use(
    '/clubs',
    protectRoute,
    require('./routes/clubRoutes')
);

// Memberships
app.use(
    '/memberships',
    protectRoute,
    require('./routes/membershipRoutes')
);

// Patron self-service dashboard (role=Patron only)

app.use(
    '/patron',
    protectRoute,
    patronMiddleware,
    require('./routes/patronDashboardRoutes')
);

// Patrons management (Admin-facing)
app.use(
    '/patrons',
    protectRoute,
    require('./routes/patronRoutes')
);

// Activities
app.use(
    '/activities',
    protectRoute,
    require('./routes/activityRoutes')
);

// Events
app.use(
    '/events',
    protectRoute,
    eventRoutes
);

// Attendance
app.use(
    '/attendance',
    protectRoute,
    require('./routes/attendanceRoutes')
);

// Finance
app.use(
    '/finance',
    protectRoute,
    verifyFinanceAccess,
    financeRoutes
);


// Reports routes

app.use('/reports', protectRoute, reportRoutes);




app.use(
    '/notifications',
    protectRoute,
    notificationRoutes
);


// Admin Approval
app.use(
    '/admin-approvals',
    protectRoute,
    adminApprovalRoutes
);

// Feedback
app.use(
    '/feedback',
    protectRoute,
    require('./routes/feedbackRoutes')
);

// Gallery
app.use(
    '/gallery',
    protectRoute,
    require('./routes/galleryRoutes')
);

// Achievements
app.use(
    '/achievements',
    protectRoute,
    require('./routes/achievementRoutes')
);

// Settings
app.use(
    '/settings',
    protectRoute,
    require('./routes/settingRoutes')
);

// Elections & Voting
app.use('/elections', protectRoute, electionRoutes);

// General /dashboard redirect based on user role
app.get('/dashboard', protectRoute, (req, res) => {
    if (req.session?.user?.role === 'Admin') return res.redirect('/admin/dashboard');
    if (req.session?.user?.role === 'Patron') return res.redirect('/patron/dashboard');
    if (req.session?.user?.role === 'Student') return res.redirect('/student/dashboard');
    return res.redirect('/');
});

// Compatibility for existing student navigation links.
app.get('/logout', (req, res) => res.redirect('/auth/logout'));

// ===============================
// ERROR PAGES
// ===============================
// Keep the return action appropriate for every portal.  Error pages are also
// rendered for guests, so this cannot be left to individual controllers.
const getHomeUrl = (user) => {
    if (user?.role === 'Admin') return '/admin/dashboard';
    if (user?.role === 'Patron') return '/patron/dashboard';
    if (user?.role === 'Student') return '/student/dashboard';
    return '/';
};

app.use((req, res, next) => {

    if (res.headersSent) return next();

    res.status(404).render('404', {
        homeUrl: getHomeUrl(req.session?.user),
        requestedPath: req.originalUrl
    });

});

app.use((err, req, res, next) => {

    console.error(err.stack || err);

    if (res.headersSent) return next(err);

    res.status(500).render('500', {
        homeUrl: getHomeUrl(req.session?.user)

    });

});

// ===============================
// START SERVER
// ===============================


app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log(
        `🚀 Victory School Smart Club System running on port ${PORT}`
    );
    console.log('====================================');
});

