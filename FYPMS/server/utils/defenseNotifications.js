const { sendEmail } = require('./emailService');
const { getGroupMembers } = require('./groupService');

const sendDefenseNotification = async ({ groupId, type, feedback, tags }) => {
    try {
        const members = await getGroupMembers(groupId);
        const emails = members.map(m => m.email);

        let subject, body;

        switch (type) {
            case 'approved':
                subject = 'Defense Approved';
                body = `Your defense has been approved!`;
                break;
            case 'approved_with_changes':
                subject = 'Defense Approved with Changes';
                body = `Your defense has been approved with changes. Feedback: ${feedback}`;
                break;
            case 'rejected':
                subject = 'Defense Rejected';
                body = `Your defense has been rejected. Feedback: ${feedback}\n\nPlease prepare for a re-defense.`;
                break;
        }

        // Add tags if present
        if (tags && tags.length > 0) {
            body += `\n\nQuick Feedback Tags: ${tags.join(', ')}`;
        }

        await sendEmail({
            to: emails,
            subject,
            text: body
        });

        console.log(`Defense notification sent to group ${groupId}`);
    } catch (error) {
        console.error('Failed to send defense notification:', error);
    }
};

module.exports = {
    sendDefenseNotification
};