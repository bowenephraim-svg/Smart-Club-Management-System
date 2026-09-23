const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');

exports.index = (req, res) => {
    res.render('feedback/index');
};

exports.submit = async (req, res) => {
    try {
        const { subject, category, message } = req.body;

        const userId = req.session.user ? req.session.user.id : null;

        await Feedback.create({
            user_id: userId,
            category,
            subject,
            message
        });

        // Notify admin about the new feedback
        await Notification.create({
            user_id: 1, // System Administrator
            message: `New feedback received${subject ? `: "${subject}"` : ''}.`,
            type: 'feedback_received',
            related_id: null
        });

        res.render('feedback/index', { 
            success_msg: 'Your feedback has been submitted successfully! Thank you.'
        });
    } catch (error) {
        console.error('Error saving feedback:', error);
        res.render('feedback/index', {
            error_msg: 'Failed to submit feedback. Please try again later.'
        });
    }
};