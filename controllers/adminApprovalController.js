const AdminApproval = require('../models/AdminApproval');


// ==========================================
// LIST PENDING APPROVALS
// ==========================================
exports.index = async (req, res) => {

    try {

        const students = await AdminApproval.getPendingStudents();

        res.render('admin-approvals/index', {
            students
        });

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};


// ==========================================
// APPROVE STUDENT
// ==========================================
exports.approve = async (req, res) => {

    try {

        await AdminApproval.approve(req.params.id);

        res.redirect('/admin-approvals');

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};


// ==========================================
// REJECT STUDENT
// ==========================================
exports.reject = async (req, res) => {

    try {

        await AdminApproval.reject(req.params.id);

        res.redirect('/admin-approvals');

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};