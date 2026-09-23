const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const Report = require('../models/Report');


// =====================================================
// HELPER — FORMAT CURRENCY
// =====================================================

const formatCurrency = (amount) => {
    return `KES ${Number(amount || 0).toLocaleString()}`;
};


// =====================================================
// EXPORT STUDENT REPORT — PDF
// =====================================================

exports.studentsPDF = async (req, res) => {

    try {

        const students = await Report.getStudents();

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
            'attachment; filename="student-report.pdf"'
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
            .text('Student Report', {
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


        // Table header
        doc
            .font('Helvetica-Bold')
            .fontSize(10);

        doc.text('Admission No.', 40, doc.y);
        doc.text('Name', 140, doc.y);
        doc.text('Class', 300, doc.y);
        doc.text('Gender', 400, doc.y);

        doc.moveDown(0.5);

        doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .stroke();

        doc.moveDown(0.5);


        // Students
        doc.font('Helvetica').fontSize(9);

        students.forEach((student) => {

            const name =
                `${student.first_name || ''} ${student.last_name || ''}`.trim();

            const y = doc.y;

            doc.text(student.admission_no || '-', 40, y, {
                width: 90
            });

            doc.text(name || '-', 140, y, {
                width: 150
            });

            doc.text(student.class || '-', 300, y, {
                width: 80
            });

            doc.text(student.gender || '-', 400, y, {
                width: 100
            });

            doc.moveDown(1);


            // New page when necessary
            if (doc.y > 760) {

                doc.addPage();

            }

        });


        doc.end();


    } catch (err) {

        console.error('Student PDF Export Error:', err);

        if (!res.headersSent) {
            res.status(500).send(err.message);
        }

    }

};



// =====================================================
// EXPORT STUDENT REPORT — EXCEL
// =====================================================

exports.studentsExcel = async (req, res) => {

    try {

        const students = await Report.getStudents();

        const workbook = new ExcelJS.Workbook();

        const worksheet =
            workbook.addWorksheet('Students');


        worksheet.columns = [

            {
                header: 'Admission No.',
                key: 'admission_no',
                width: 20
            },

            {
                header: 'First Name',
                key: 'first_name',
                width: 20
            },

            {
                header: 'Last Name',
                key: 'last_name',
                width: 20
            },

            {
                header: 'Class',
                key: 'class',
                width: 15
            },

            {
                header: 'Gender',
                key: 'gender',
                width: 15
            }

        ];


        students.forEach(student => {

            worksheet.addRow({

                admission_no: student.admission_no,

                first_name: student.first_name,

                last_name: student.last_name,

                class: student.class,

                gender: student.gender

            });

        });


        // Style header
        worksheet.getRow(1).font = {
            bold: true
        };


        worksheet.getRow(1).alignment = {
            vertical: 'middle'
        };


        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="student-report.xlsx"'
        );


        await workbook.xlsx.write(res);

        res.end();


    } catch (err) {

        console.error('Student Excel Export Error:', err);

        if (!res.headersSent) {
            res.status(500).send(err.message);
        }

    }

};



// =====================================================
// EXPORT CLUB REPORT — PDF
// =====================================================

exports.clubsPDF = async (req, res) => {

    try {

        const clubs = await Report.getClubs();

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
            'attachment; filename="club-report.pdf"'
        );


        doc.pipe(res);


        doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Smart Club Management System', {
                align: 'center'
            });

        doc
            .moveDown(0.5)
            .fontSize(16)
            .text('Club Report', {
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


        doc.font('Helvetica-Bold').fontSize(10);

        doc.text('Club Name', 40, doc.y);
        doc.text('Patron', 250, doc.y);
        doc.text('Date Created', 400, doc.y);

        doc.moveDown(0.5);

        doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .stroke();

        doc.moveDown(0.5);


        doc.font('Helvetica').fontSize(9);


        clubs.forEach(club => {

            const y = doc.y;

            doc.text(club.club_name || '-', 40, y, {
                width: 190
            });

            doc.text(club.patron_name || '-', 250, y, {
                width: 140
            });

            doc.text(
                club.date_created
                    ? new Date(club.date_created).toLocaleDateString()
                    : '-',
                400,
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

        console.error('Club PDF Export Error:', err);

        if (!res.headersSent) {
            res.status(500).send(err.message);
        }

    }

};



// =====================================================
// EXPORT CLUB REPORT — EXCEL
// =====================================================

exports.clubsExcel = async (req, res) => {

    try {

        const clubs = await Report.getClubs();

        const workbook = new ExcelJS.Workbook();

        const worksheet =
            workbook.addWorksheet('Clubs');


        worksheet.columns = [

            {
                header: 'Club Name',
                key: 'club_name',
                width: 30
            },

            {
                header: 'Patron',
                key: 'patron_name',
                width: 25
            },

            {
                header: 'Date Created',
                key: 'date_created',
                width: 20
            }

        ];


        clubs.forEach(club => {

            worksheet.addRow({

                club_name: club.club_name,

                patron_name: club.patron_name,

                date_created: club.date_created

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
            'attachment; filename="club-report.xlsx"'
        );


        await workbook.xlsx.write(res);

        res.end();


    } catch (err) {

        console.error('Club Excel Export Error:', err);

        if (!res.headersSent) {
            res.status(500).send(err.message);
        }

    }

};



// =====================================================
// EXPORT FINANCE REPORT — PDF
// =====================================================

exports.financePDF = async (req, res) => {

    try {

        const finance = await Report.getFinance();


        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });


        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="finance-report.pdf"'
        );


        doc.pipe(res);


        doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Smart Club Management System', {
                align: 'center'
            });


        doc
            .moveDown(0.5)
            .fontSize(16)
            .text('Financial Report', {
                align: 'center'
            });


        doc
            .moveDown(0.5)
            .fontSize(9)
            .font('Helvetica')
            .text(`Generated: ${new Date().toLocaleString()}`, {
                align: 'center'
            });


        doc.moveDown(3);


        doc
            .fontSize(13)
            .font('Helvetica-Bold')
            .text('Financial Summary');


        doc.moveDown(1);


        doc
            .fontSize(12)
            .font('Helvetica')
            .text(`Total Income:     ${formatCurrency(finance.totalIncome)}`);


        doc
            .moveDown(0.7)
            .text(`Total Expenses:   ${formatCurrency(finance.totalExpenses)}`);


        doc
            .moveDown(0.7)
            .font('Helvetica-Bold')
            .text(`Available Balance: ${formatCurrency(finance.balance)}`);


        doc.moveDown(3);


        doc
            .fontSize(9)
            .font('Helvetica')
            .text(
                'This report was generated by the Smart Club Management System.',
                {
                    align: 'center'
                }
            );


        doc.end();


    } catch (err) {

        console.error('Finance PDF Export Error:', err);

        if (!res.headersSent) {
            res.status(500).send(err.message);
        }

    }

};



// =====================================================
// EXPORT FINANCE REPORT — EXCEL
// =====================================================

exports.financeExcel = async (req, res) => {

    try {

        const finance = await Report.getFinance();


        const workbook = new ExcelJS.Workbook();

        const worksheet =
            workbook.addWorksheet('Finance');


        worksheet.columns = [

            {
                header: 'Metric',
                key: 'metric',
                width: 30
            },

            {
                header: 'Amount (KES)',
                key: 'amount',
                width: 20
            }

        ];


        worksheet.addRow({
            metric: 'Total Income',
            amount: finance.totalIncome
        });


        worksheet.addRow({
            metric: 'Total Expenses',
            amount: finance.totalExpenses
        });


        worksheet.addRow({
            metric: 'Available Balance',
            amount: finance.balance
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
            'attachment; filename="finance-report.xlsx"'
        );


        await workbook.xlsx.write(res);

        res.end();


    } catch (err) {

        console.error('Finance Excel Export Error:', err);

        if (!res.headersSent) {
            res.status(500).send(err.message);
        }

    }

};