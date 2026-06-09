const { transporter } = require('../config/email');
const { pool } = require('../config/database');
require('dotenv').config();

// ============================================
// LOG PROPOSAL ACTIVITY
// ============================================
const logProposalActivity = async (connection, activityData) => {
  try {
    const {
      proposalId,
      userId,
      userRole,
      action,
      oldValue = null,
      newValue = null,
      ipAddress = null
    } = activityData;

    await connection.execute(
      `INSERT INTO proposal_activity_logs 
       (proposal_id, user_id, user_role, action, old_value, new_value, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        proposalId,
        userId,
        userRole,
        action,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress
      ]
    );
  } catch (error) {
    console.error('Error logging proposal activity:', error);
    // Don't throw error - logging should not break the main flow
  }
};

// ============================================
// EMAIL TEMPLATE
// ============================================
const emailTemplate = (content, headerGradient = 'linear-gradient(135deg, #193869 0%, #234e92 100%)') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${headerGradient}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #d29538; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #b8802f; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #193869; margin: 20px 0; border-radius: 4px; }
    .success-box { background: #d1fae5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
    .warning-box { background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
    .danger-box { background: #fee2e2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .footer p { margin: 5px 0; }
    h3 { margin-top: 0; color: #193869; }
    p { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
`;

// ============================================
// SEND PROPOSAL NOTIFICATION EMAIL
// ============================================
const sendProposalNotification = async (notificationData) => {
  const { 
    type, 
    to, 
    supervisorName, 
    studentName, 
    projectTitle, 
    proposalId, 
    feedback,
    leadStudentName,
    token,
    memberSapId
  } = notificationData;

  let subject, htmlContent;

  switch (type) {
    // ============================================
    // NOTIFICATION: Group Invitation
    // ============================================
    case 'GROUP_INVITATION':
      subject = 'Group Invitation: Join Final Year Project Proposal';
      htmlContent = `
        <div class="header">
          <h1>📋 Group Invitation</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${studentName || 'Student'}</strong>,</p>
          <p>You have been added as a group member in a Final Year Project proposal.</p>
          
          <div class="info-box">
            <h3>Proposal Details</h3>
            <p><strong>Lead Student:</strong> ${leadStudentName}</p>
            <p><strong>Project Title:</strong> ${projectTitle}</p>
            <p><strong>Proposal ID:</strong> #${proposalId}</p>
          </div>
          
          <p>Please confirm whether you want to join this FYP group. Your decision will be shared with the group lead.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <h3 style="margin-bottom: 20px;">Choose an option</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">Click one of the buttons below to confirm your decision:</p>
            
            <a href="${process.env.FRONTEND_URL}/invitation/respond?token=${token}&action=accept" class="button" style="background: #10b981; margin-right: 10px; color: white;">
              ✅ Yes, I want to join
            </a>
            <a href="${process.env.FRONTEND_URL}/invitation/respond?token=${token}&action=reject" class="button" style="background: #ef4444; color: white;">
              ❌ No, I don’t want to join
            </a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280; font-style: italic;">
            If you did not expect this email, you can safely ignore it. You will not be added to the group unless you confirm.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated email from the FYP Management System</p>
          <p>© ${new Date().getFullYear()} Final Year Project Management System</p>
        </div>
      `;
      break;

    // ============================================
    // NOTIFICATION: Invitation Accepted
    // ============================================
    case 'INVITATION_ACCEPTED':
      subject = 'Group Invitation Accepted';
      htmlContent = `
        <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
          <h1>✅ Invitation Accepted</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${leadStudentName}</strong>,</p>
          
          <p>Your group invitation has been accepted.</p>
          
          <div class="success-box">
            <h3>Acceptance Details</h3>
            <p><strong>Student:</strong> ${studentName} (${memberSapId})</p>
            <p><strong>Project Title:</strong> ${projectTitle}</p>
            <p><strong>Proposal ID:</strong> #${proposalId}</p>
          </div>
          
          <p>The student is now part of your FYP group.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/proposals" class="button">
              View Proposal
            </a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from the FYP Management System</p>
          <p>© ${new Date().getFullYear()} Final Year Project Management System</p>
        </div>
      `;
      break;

    // ============================================
    // NOTIFICATION: Invitation Rejected
    // ============================================
    case 'INVITATION_REJECTED':
      subject = 'Group Invitation Rejected';
      htmlContent = `
        <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
          <h1>❌ Invitation Rejected</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${leadStudentName}</strong>,</p>
          
          <p>Your group invitation has been rejected by a student.</p>
          
          <div class="danger-box">
            <h3>Rejection Details</h3>
            <p><strong>Student:</strong> ${studentName} (${memberSapId})</p>
            <p><strong>Project Title:</strong> ${projectTitle}</p>
            <p><strong>Proposal ID:</strong> #${proposalId}</p>
          </div>
          
          <p>Please choose how you would like to proceed:</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/login?redirect=/proposals" class="button" style="background: #193869; margin-right: 10px; display: block; margin-bottom: 10px;">
              1. Login and Add Another Member
            </a>
            <a href="${process.env.BACKEND_URL}/api/proposals/public/submit-without-member?id=${proposalId}&token=${token}" class="button" style="background: #10b981; display: block;">
              2. Do Not Add Member and Submit Proposal
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            <strong>Note:</strong> Option 2 will submit your proposal immediately with the remaining group members.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated email from the FYP Management System</p>
          <p>© ${new Date().getFullYear()} Final Year Project Management System</p>
        </div>
      `;
      break;

    // ============================================
    // NOTIFICATION: Proposal Submitted Successfully (to Members)
    // ============================================
    case 'PROPOSAL_SUBMITTED_CONFIRMATION':
      subject = 'FYP Proposal Submitted Successfully';
      htmlContent = `
        <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
          <h1>✅ Proposal Submitted</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${studentName || 'Student'}</strong>,</p>
          
          <p>Your Final Year Project proposal has been successfully submitted to the supervisor.</p>
          
          <div class="success-box">
            <h3>Proposal Details</h3>
            <p><strong>Project Title:</strong> ${projectTitle}</p>
            <p><strong>Supervisor:</strong> ${supervisorName}</p>
            <p><strong>Proposal ID:</strong> #${proposalId}</p>
          </div>
          
          <p>All group members have confirmed, and the proposal is now under review by the supervisor.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/proposals" class="button">
              View Status
            </a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from the FYP Management System</p>
          <p>© ${new Date().getFullYear()} Final Year Project Management System</p>
        </div>
      `;
      break;

    // ============================================
    // NOTIFICATION: Proposal Submitted to Supervisor
    // ============================================
    case 'PROPOSAL_SUBMITTED':
      subject = 'New Proposal Submitted for Your Review';
      htmlContent = `
        <div class="header">
          <h1>📋 New Proposal Received</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${supervisorName}</strong>,</p>
          
          <p>A new Final Year Project proposal has been submitted for your review.</p>
          
          <div class="info-box">
            <h3>Proposal Details</h3>
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Project Title:</strong> ${projectTitle}</p>
            <p><strong>Proposal ID:</strong> #${proposalId}</p>
            <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <p>Please review this proposal at your earliest convenience and provide your feedback.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/supervisor/proposals" class="button">
              Review Proposal
            </a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            You can approve, reject, or request revisions from the proposal review page.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated email from the FYP Management System</p>
          <p>© ${new Date().getFullYear()} Final Year Project Management System</p>
        </div>
      `;
      break;

    // ============================================
    // NOTIFICATION: Proposal Approved
    // ============================================
    case 'PROPOSAL_APPROVED':
      subject = '✅ Your Proposal Has Been Approved!';
      htmlContent = `
        <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
          <h1>🎉 Congratulations!</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${studentName}</strong>,</p>
          
          <div class="success-box">
            <h3 style="color: #059669;">Your proposal has been approved!</h3>
            <p><strong>Project Title:</strong> ${projectTitle}</p>
            <p><strong>Supervisor:</strong> ${supervisorName}</p>
            <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <p>Your supervisor has reviewed and approved your proposal. You can now proceed with your Final Year Project.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/proposals" class="button">
              View Proposal Details
            </a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Please coordinate with your supervisor for the next steps in your project.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated email from the FYP Management System</p>
          <p>© ${new Date().getFullYear()} Final Year Project Management System</p>
        </div>
      `;
      break;

    // ============================================
    // NOTIFICATION: Proposal Rejected
    // ============================================
    case 'PROPOSAL_REJECTED':
      subject = 'Proposal Review: Changes Required';
      htmlContent = `
        <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
          <h1>📝 Proposal Review</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${studentName}</strong>,</p>
          
          <p>Your supervisor has reviewed your proposal and provided feedback.</p>
          
          <div class="danger-box">
            <h3 style="color: #dc2626;">Supervisor Feedback</h3>
            <p><strong>Project Title:</strong> ${projectTitle}</p>
            <p><strong>Supervisor:</strong> ${supervisorName}</p>
            <p style="margin-top: 15px; white-space: pre-line;">${feedback || 'No specific feedback provided.'}</p>
          </div>
          
          <p>Please review the feedback carefully. You may submit a new proposal addressing the concerns raised.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/proposals" class="button">
              View Full Feedback
            </a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from the FYP Management System</p>
          <p>© ${new Date().getFullYear()} Final Year Project Management System</p>
        </div>
      `;
      break;

    // ============================================
    // NOTIFICATION: Revision Requested
    // ============================================
    case 'REVISION_REQUESTED':
      subject = 'Proposal Revision Requested';
      htmlContent = `
        <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
          <h1>🔄 Revision Required</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${studentName}</strong>,</p>
          
          <p>Your supervisor has requested revisions to your proposal.</p>
          
          <div class="warning-box">
            <h3 style="color: #d97706;">Revision Feedback</h3>
            <p><strong>Project Title:</strong> ${projectTitle}</p>
            <p><strong>Supervisor:</strong> ${supervisorName}</p>
            <p style="margin-top: 15px; white-space: pre-line;">${feedback || 'No specific feedback provided.'}</p>
          </div>
          
          <p>Please make the requested changes and resubmit your proposal.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/proposals" class="button">
              Revise Proposal
            </a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from the FYP Management System</p>
          <p>© ${new Date().getFullYear()} Final Year Project Management System</p>
        </div>
      `;
      break;

    default:
      console.error('Unknown notification type:', type);
      return false;
  }

  // ============================================
  // SEND EMAIL USING CENTRALIZED TRANSPORTER
  // ============================================
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      html: emailTemplate(htmlContent)
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification sent: ${type} to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending proposal notification:', error);
    // Don't throw error - email failure should not break the main flow
    return false;
  }
};

module.exports = {
  logProposalActivity,
  sendProposalNotification
};
