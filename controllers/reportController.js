const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const Report = require('../models/Report');


// =====================================================
// HELPER — FORMAT CURRENCY
// =====================================================

const formatCurrency = (amount) => {
    return `KES ${Number(amount || 0).toLocaleString()}`;
};

// ==========================================
// REPORTS DASHBOARD
// ==========================================
exports.index = async (req, res) => {

    try {

        const [
            totalStudents,
            totalClubs,
            totalMemberships,
            totalActivities,
            totalIncome,
            totalExpenses,
            totalPatrons,
            activeClubs,
            clubFinances,
            monthlyFinance
        ] = await Promise.all([
            Report.totalStudents(),
            Report.totalClubs(),
            Report.totalMemberships(),
            Report.totalActivities(),
            Report.totalIncome(),
            Report.totalExpenses(),
            Report.totalPatrons(),
            Report.getActiveClubs(),
            Report.getClubFinances(),
            Report.getMonthlyFinance()
        ]);

        const balance = totalIncome - totalExpenses;

        res.render('reports/index', {
            totalStudents,
            totalClubs,
            totalMemberships,
            totalActivities,
            totalIncome,
            totalExpenses,
            totalPatrons,
            balance,
            activeClubs,
            clubFinances,
            monthlyFinance
        });

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }
};


// ==========================================
// STUDENT REPORT
// ==========================================
exports.studentsReport = async (req, res) => {

    try {

        const students = await Report.getStudents();

        res.render('reports/students', {
            students
        });

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};


// ==========================================
// CLUB REPORT
// ==========================================
exports.clubsReport = async (req, res) => {

    try {

        const clubs = await Report.getClubs();

        res.render('reports/clubs', {
            clubs
        });

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};


// ==========================================
// ATTENDANCE REPORT
// ==========================================
exports.attendanceReport = async (req, res) => {

    try {

        const attendance = await Report.getAttendance();

        res.render('reports/attendance', {
            attendance
        });

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};


// ==========================================
// FINANCE REPORT
// ==========================================
exports.financeReport = async (req, res) => {

    try {

        const finance = await Report.getFinance();

        res.render('reports/finance', {
            totalIncome: finance.totalIncome,
            totalExpenses: finance.totalExpenses,
            balance: finance.balance,
            clubFinances: finance.clubFinances || [],
            monthlyFinance: finance.monthlyFinance || []
        });

    } catch (err) {

        console.error('Finance dashboard error:', err);

        res.status(500).send(err.message);

    }

};


// ==========================================
// ANALYTICS REPORT
// ==========================================
exports.analyticsReport = async (req, res) => {

    try {

        const analytics = await Report.getAnalytics();


        res.render('reports/analytics', {

            studentCount: analytics.studentCount,

            clubCount: analytics.clubCount,

            membershipCount: analytics.membershipCount,


            paymentTotal: analytics.paymentTotal,

            expenseTotal: analytics.expenseTotal,

            balance: analytics.balance,


            clubMemberships: analytics.clubMemberships,

            monthlyPayments: analytics.monthlyPayments,

            monthlyExpenses: analytics.monthlyExpenses,

            activityAttendance: analytics.activityAttendance

        });


    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};

// =====================================================
// EXPORT ATTENDANCE REPORT — PDF
// =====================================================

exports.attendancePDF = async (req, res) => {

    try {

        const attendance = await Report.getAttendance();

        const doc = new PDFDocument({
            margin: 40,
            size: 'A4'
        });

        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="attendance-report.pdf"'
        );

        doc.pipe(res);


        // Header
        doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Smart Club Management System', {
                align: 'center'
            });

        doc
            .moveDown(0.5)
            .fontSize(16)
            .text('Attendance Report', {
                align: 'center'
            });

        doc
            .moveDown(0.5)
            .fontSize(9)
            .font('Helvetica')
            .text(`Generated: ${new Date().toLocaleString()}`, {
                align: 'center'
            });

        doc.moveDown(2);


        // Table headings
        doc
            .font('Helvetica-Bold')
            .fontSize(10);

        doc.text('Activity', 40, doc.y, {
            width: 180
        });

        doc.text('Club', 225, doc.y, {
            width: 140
        });

        doc.text('Registrations', 390, doc.y, {
            width: 100
        });

        doc.moveDown(0.5);

        doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .stroke();

        doc.moveDown(0.5);


        // Data
        doc
            .font('Helvetica')
            .fontSize(9);


        attendance.forEach(item => {

            const y = doc.y;

            doc.text(
                item.activity_name || '-',
                40,
                y,
                {
                    width: 180
                }
            );

            doc.text(
                item.club_name || '-',
                225,
                y,
                {
                    width: 140
                }
            );

            doc.text(
                String(item.registrations || 0),
                390,
                y,
                {
                    width: 100
                }
            );

            doc.moveDown(1);


            if (doc.y > 760) {

                doc.addPage();

            }

        });


        doc.end();


    } catch (err) {

        console.error(
            'Attendance PDF Export Error:',
            err
        );

        if (!res.headersSent) {

            res.status(500).send(err.message);

        }

    }

};



// =====================================================
// EXPORT ATTENDANCE REPORT — EXCEL
// =====================================================

exports.attendanceExcel = async (req, res) => {

    try {

        const attendance = await Report.getAttendance();

        const workbook = new ExcelJS.Workbook();

        const worksheet =
            workbook.addWorksheet('Attendance');


        worksheet.columns = [

            {
                header: 'Activity',
                key: 'activity_name',
                width: 35
            },

            {
                header: 'Club',
                key: 'club_name',
                width: 25
            },

            {
                header: 'Registrations',
                key: 'registrations',
                width: 20
            }

        ];


        attendance.forEach(item => {

            worksheet.addRow({

                activity_name: item.activity_name,

                club_name: item.club_name,

                registrations: Number(
                    item.registrations || 0
                )

            });

        });


        worksheet.getRow(1).font = {
            bold: true
        };


        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="attendance-report.xlsx"'
        );


        await workbook.xlsx.write(res);

        res.end();


    } catch (err) {

        console.error(
            'Attendance Excel Export Error:',
            err
        );

        if (!res.headersSent) {

            res.status(500).send(err.message);

        }

    }

};
// =====================================================
// EXPORT ANALYTICS REPORT — PDF
// =====================================================

exports.analyticsPDF = async (req, res) => {

    try {

        const analytics = await Report.getAnalytics();

        const doc = new PDFDocument({
            margin: 40,
            size: 'A4'
        });


        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="analytics-report.pdf"'
        );


        doc.pipe(res);


        // =================================================
        // HEADER
        // =================================================

        doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Smart Club Management System', {
                align: 'center'
            });


        doc
            .moveDown(0.5)
            .fontSize(16)
            .text('Analytics Report', {
                align: 'center'
            });


        doc
            .moveDown(0.5)
            .fontSize(9)
            .font('Helvetica')
            .text(
                `Generated: ${new Date().toLocaleString()}`,
                {
                    align: 'center'
                }
            );


        doc.moveDown(2);


        // =================================================
        // SYSTEM SUMMARY
        // =================================================

        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('System Summary');


        doc.moveDown(1);


        doc
            .fontSize(11)
            .font('Helvetica')
            .text(
                `Total Students: ${Number(
                    analytics.studentCount || 0
                ).toLocaleString()}`
            );


        doc
            .moveDown(0.5)
            .text(
                `Total Clubs: ${Number(
                    analytics.clubCount || 0
                ).toLocaleString()}`
            );


        doc
            .moveDown(0.5)
            .text(
                `Total Memberships: ${Number(
                    analytics.membershipCount || 0
                ).toLocaleString()}`
            );


        doc.moveDown(1.5);


        // =================================================
        // FINANCIAL SUMMARY
        // =================================================

        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Financial Summary');


        doc.moveDown(1);


        doc
            .fontSize(11)
            .font('Helvetica')
            .text(
                `Total Income: ${formatCurrency(
                    analytics.paymentTotal
                )}`
            );


        doc
            .moveDown(0.5)
            .text(
                `Total Expenses: ${formatCurrency(
                    analytics.expenseTotal
                )}`
            );


        doc
            .moveDown(0.5)
            .font('Helvetica-Bold')
            .text(
                `Available Balance: ${formatCurrency(
                    analytics.balance
                )}`
            );


        doc.moveDown(2);


        // =================================================
        // CLUB MEMBERSHIP DISTRIBUTION
        // =================================================

        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Club Membership Distribution');


        doc.moveDown(1);


        doc
            .fontSize(10)
            .font('Helvetica-Bold');


        doc.text('Club', 40, doc.y, {
            width: 300
        });


        doc.text('Members', 380, doc.y, {
            width: 100
        });


        doc.moveDown(0.5);


        doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .stroke();


        doc.moveDown(0.5);


        doc
            .font('Helvetica')
            .fontSize(9);


        (analytics.clubMemberships || []).forEach(item => {

            const y = doc.y;


            doc.text(
                item.club_name || '-',
                40,
                y,
                {
                    width: 300
                }
            );


            doc.text(
                String(item.members || 0),
                380,
                y,
                {
                    width: 100
                }
            );


            doc.moveDown(1);


            if (doc.y > 750) {

                doc.addPage();

            }

        });


        doc.moveDown(1);


        // =================================================
        // MONTHLY FINANCE
        // =================================================

        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Monthly Finance');


        doc.moveDown(1);


        doc
            .fontSize(10)
            .font('Helvetica-Bold');


        doc.text('Month', 40, doc.y, {
            width: 150
        });


        doc.text('Income', 230, doc.y, {
            width: 120
        });


        doc.text('Expenses', 380, doc.y, {
            width: 120
        });


        doc.moveDown(0.5);


        doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .stroke();


        doc.moveDown(0.5);


        doc
            .font('Helvetica')
            .fontSize(9);


        const monthlyPayments =
            analytics.monthlyPayments || [];


        const monthlyExpenses =
            analytics.monthlyExpenses || [];


        const expenseMap = {};


        monthlyExpenses.forEach(item => {

            expenseMap[item.month] =
                Number(item.total || 0);

        });


        monthlyPayments.forEach(item => {

            const y = doc.y;

            const income =
                Number(item.total || 0);

            const expenses =
                Number(expenseMap[item.month] || 0);


            doc.text(
                item.month || '-',
                40,
                y,
                {
                    width: 150
                }
            );


            doc.text(
                formatCurrency(income),
                230,
                y,
                {
                    width: 120
                }
            );


            doc.text(
                formatCurrency(expenses),
                380,
                y,
                {
                    width: 120
                }
            );


            doc.moveDown(1);


            if (doc.y > 750) {

                doc.addPage();

            }

        });


        doc.moveDown(1);


        // =================================================
        // ACTIVITY ATTENDANCE
        // =================================================

        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Activity Attendance');


        doc.moveDown(1);


        doc
            .fontSize(10)
            .font('Helvetica-Bold');


        doc.text('Activity', 40, doc.y, {
            width: 300
        });


        doc.text('Present', 380, doc.y, {
            width: 100
        });


        doc.moveDown(0.5);


        doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .stroke();


        doc.moveDown(0.5);


        doc
            .font('Helvetica')
            .fontSize(9);


        (analytics.activityAttendance || []).forEach(item => {

            const y = doc.y;


            doc.text(
                item.activity_name || '-',
                40,
                y,
                {
                    width: 300
                }
            );


            doc.text(
                String(item.present || 0),
                380,
                y,
                {
                    width: 100
                }
            );


            doc.moveDown(1);


            if (doc.y > 750) {

                doc.addPage();

            }

        });


        doc.moveDown(2);


        doc
            .fontSize(8)
            .font('Helvetica')
            .text(
                'Generated by the Smart Club Management System.',
                {
                    align: 'center'
                }
            );


        doc.end();


    } catch (err) {

        console.error(
            'Analytics PDF Export Error:',
            err
        );


        if (!res.headersSent) {

            res.status(500).send(err.message);

        }

    }

};



// =====================================================
// EXPORT ANALYTICS REPORT — EXCEL
// =====================================================

exports.analyticsExcel = async (req, res) => {

    try {

        const analytics = await Report.getAnalytics();


        const workbook =
            new ExcelJS.Workbook();


        // =================================================
        // SUMMARY SHEET
        // =================================================

        const summary =
            workbook.addWorksheet('Summary');


        summary.columns = [

            {
                header: 'Metric',
                key: 'metric',
                width: 30
            },

            {
                header: 'Value',
                key: 'value',
                width: 25
            }

        ];


        summary.addRow({
            metric: 'Total Students',
            value: Number(
                analytics.studentCount || 0
            )
        });


        summary.addRow({
            metric: 'Total Clubs',
            value: Number(
                analytics.clubCount || 0
            )
        });


        summary.addRow({
            metric: 'Total Memberships',
            value: Number(
                analytics.membershipCount || 0
            )
        });


        summary.addRow({
            metric: 'Total Income',
            value: Number(
                analytics.paymentTotal || 0
            )
        });


        summary.addRow({
            metric: 'Total Expenses',
            value: Number(
                analytics.expenseTotal || 0
            )
        });


        summary.addRow({
            metric: 'Available Balance',
            value: Number(
                analytics.balance || 0
            )
        });


        summary.getRow(1).font = {
            bold: true
        };


        // =================================================
        // CLUB MEMBERSHIP SHEET
        // =================================================

        const clubs =
            workbook.addWorksheet('Club Memberships');


        clubs.columns = [

            {
                header: 'Club',
                key: 'club_name',
                width: 35
            },

            {
                header: 'Members',
                key: 'members',
                width: 20
            }

        ];


        (analytics.clubMemberships || []).forEach(item => {

            clubs.addRow({

                club_name: item.club_name,

                members: Number(
                    item.members || 0
                )

            });

        });


        clubs.getRow(1).font = {
            bold: true
        };


        // =================================================
        // MONTHLY FINANCE SHEET
        // =================================================

        const monthlyFinance =
            workbook.addWorksheet('Monthly Finance');


        monthlyFinance.columns = [

            {
                header: 'Month',
                key: 'month',
                width: 20
            },

            {
                header: 'Income (KES)',
                key: 'income',
                width: 20
            },

            {
                header: 'Expenses (KES)',
                key: 'expenses',
                width: 20
            }

        ];


        const monthlyPayments =
            analytics.monthlyPayments || [];


        const monthlyExpenses =
            analytics.monthlyExpenses || [];


        const expenseMap = {};


        monthlyExpenses.forEach(item => {

            expenseMap[item.month] =
                Number(item.total || 0);

        });


        monthlyPayments.forEach(item => {

            monthlyFinance.addRow({

                month: item.month,

                income: Number(
                    item.total || 0
                ),

                expenses: Number(
                    expenseMap[item.month] || 0
                )

            });

        });


        monthlyFinance.getRow(1).font = {
            bold: true
        };


        // =================================================
        // ACTIVITY ATTENDANCE SHEET
        // =================================================

        const attendance =
            workbook.addWorksheet('Activity Attendance');


        attendance.columns = [

            {
                header: 'Activity',
                key: 'activity_name',
                width: 40
            },

            {
                header: 'Students Present',
                key: 'present',
                width: 25
            }

        ];


        (analytics.activityAttendance || []).forEach(item => {

            attendance.addRow({

                activity_name:
                    item.activity_name,

                present: Number(
                    item.present || 0
                )

            });

        });


        attendance.getRow(1).font = {
            bold: true
        };


        // =================================================
        // RESPONSE
        // =================================================

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );


        res.setHeader(
            'Content-Disposition',
            'attachment; filename="analytics-report.xlsx"'
        );


        await workbook.xlsx.write(res);

        res.end();


    } catch (err) {

        console.error(
            'Analytics Excel Export Error:',
            err
        );


        if (!res.headersSent) {

            res.status(500).send(err.message);

        }

    }

};