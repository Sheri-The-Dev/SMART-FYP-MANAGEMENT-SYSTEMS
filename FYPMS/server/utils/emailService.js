const { transporter } = require('../config/email');
require('dotenv').config();

// Base email template with branding
const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #193869 0%, #234e92 100%); 
              color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .button { display: inline-block; padding: 12px 30px; background: #d29538; 
              color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .warning { background: #fff3cd; border-left: 4px solid #d29538; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FYP Authentication System</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2025 FYP Authentication System. All rights reserved.</p>
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

// Password reset email
const sendPasswordResetEmail = async (email, username, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>You requested to reset your password. Click the button below to create a new password:</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #193869;">${resetUrl}</p>
    <div class="warning">
      <strong>⚠️ Security Notice:</strong>
      <ul>
        <li>This link will expire in 1 hour</li>
        <li>If you didn't request this, please ignore this email</li>
        <li>Never share this link with anyone</li>
      </ul>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request - FYP Auth System',
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

// Account creation email
const sendAccountCreationEmail = async (email, username, sapId, temporaryPassword, department = null) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  
  const content = `
    <h2>Your Account Has Been Created</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>An administrator has created an account for you in the FYP Authentication System.</p>
    <h3>Login Credentials:</h3>
    <ul>
      <li><strong>Username:</strong> ${username}</li>
      <li><strong>SAP ID:</strong> ${sapId}</li>
      <li><strong>Email:</strong> ${email}</li>
      ${department ? `<li><strong>Department:</strong> ${department}</li>` : ''}
      <li><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></li>
    </ul>
    <a href="${loginUrl}" class="button">Login Now</a>
    <div class="warning">
      <strong>🔒 Important:</strong>
      <ul>
        <li>Please change your password after first login</li>
        <li>Keep your credentials secure</li>
        <li>Never share your password with anyone</li>
        <li>You can log in using your email, username, or SAP ID</li>
      </ul>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your Account Has Been Created - FYP Auth System',
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

// Security question challenge email
const sendSecurityChallengeEmail = async (email, username, token, adminName) => {
  const challengeUrl = `${process.env.FRONTEND_URL}/security-challenge?token=${token}`;
  
  const content = `
    <h2>Security Verification Required</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>Administrator <strong>${adminName}</strong> has initiated a password reset for your account.</p>
    <p>To proceed, please verify your identity by answering your security questions:</p>
    <a href="${challengeUrl}" class="button">Verify Identity</a>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #193869;">${challengeUrl}</p>
    <div class="warning">
      <strong>⚠️ Security Notice:</strong>
      <ul>
        <li>This link will expire in 30 minutes</li>
        <li>If you didn't request this, contact the administrator immediately</li>
        <li>Your answers must match exactly</li>
      </ul>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Security Verification Required - FYP Auth System',
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

// Password changed notification
const sendPasswordChangedEmail = async (email, username) => {
  const content = `
    <h2>Password Changed Successfully</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>Your password has been changed successfully.</p>
    <p>If you didn't make this change, please contact an administrator immediately.</p>
    <div class="warning">
      <strong>🔒 Security Tip:</strong>
      <ul>
        <li>Use a unique password for each account</li>
        <li>Never share your password</li>
        <li>Enable additional security features when available</li>
      </ul>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Changed - FYP Auth System',
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw error for notification emails
    return false;
  }
};

// Proposal submitted to supervisor
const sendProposalSubmittedEmail = async (supervisorEmail, supervisorName, studentName, projectTitle, proposalId) => {
  const proposalUrl = `${process.env.FRONTEND_URL}/supervisor/proposals`;
  
  const content = `
    <h2>New Proposal Submitted for Review</h2>
    <p>Hello <strong>${supervisorName}</strong>,</p>
    <p>A student has submitted a Final Year Project proposal for your review.</p>
    <h3>Proposal Details:</h3>
    <ul>
      <li><strong>Student:</strong> ${studentName}</li>
      <li><strong>Project Title:</strong> ${projectTitle}</li>
      <li><strong>Proposal ID:</strong> #${proposalId}</li>
    </ul>
    <a href="${proposalUrl}" class="button">Review Proposal</a>
    <p>Please review the proposal at your earliest convenience.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: supervisorEmail,
    subject: `New Proposal Submitted: ${projectTitle}`,
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Proposal approved
const sendProposalApprovedEmail = async (studentEmail, studentName, projectTitle, supervisorName) => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/proposals`;
  
  const content = `
    <h2>🎉 Your Proposal Has Been Approved!</h2>
    <p>Hello <strong>${studentName}</strong>,</p>
    <p>Great news! Your Final Year Project proposal has been approved by your supervisor.</p>
    <h3>Proposal Details:</h3>
    <ul>
      <li><strong>Project Title:</strong> ${projectTitle}</li>
      <li><strong>Supervisor:</strong> ${supervisorName}</li>
      <li><strong>Status:</strong> <span style="color: green; font-weight: bold;">Approved</span></li>
    </ul>
    <a href="${dashboardUrl}" class="button">View Dashboard</a>
    <p>You can now proceed with your project. Best of luck!</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: studentEmail,
    subject: `Proposal Approved: ${projectTitle}`,
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Proposal rejected
const sendProposalRejectedEmail = async (studentEmail, studentName, projectTitle, supervisorName, feedback) => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/proposals`;
  
  const content = `
    <h2>Proposal Review Decision</h2>
    <p>Hello <strong>${studentName}</strong>,</p>
    <p>Your supervisor has reviewed your Final Year Project proposal.</p>
    <h3>Proposal Details:</h3>
    <ul>
      <li><strong>Project Title:</strong> ${projectTitle}</li>
      <li><strong>Supervisor:</strong> ${supervisorName}</li>
      <li><strong>Status:</strong> <span style="color: red; font-weight: bold;">Rejected</span></li>
    </ul>
    <h3>Supervisor Feedback:</h3>
    <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
      <p style="margin: 0; white-space: pre-line;">${feedback}</p>
    </div>
    <a href="${dashboardUrl}" class="button">View Dashboard</a>
    <p>Please review the feedback carefully. You may consider revising your proposal and resubmitting with a new topic.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: studentEmail,
    subject: `Proposal Decision: ${projectTitle}`,
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Revision requested
const sendRevisionRequestedEmail = async (studentEmail, studentName, projectTitle, supervisorName, feedback) => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/proposals`;
  
  const content = `
    <h2>Proposal Revision Required</h2>
    <p>Hello <strong>${studentName}</strong>,</p>
    <p>Your supervisor has reviewed your proposal and requested some revisions.</p>
    <h3>Proposal Details:</h3>
    <ul>
      <li><strong>Project Title:</strong> ${projectTitle}</li>
      <li><strong>Supervisor:</strong> ${supervisorName}</li>
      <li><strong>Status:</strong> <span style="color: orange; font-weight: bold;">Revision Required</span></li>
    </ul>
    <h3>Supervisor Feedback:</h3>
    <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #d29538; margin: 20px 0;">
      <p style="margin: 0; white-space: pre-line;">${feedback}</p>
    </div>
    <a href="${dashboardUrl}" class="button">Revise Proposal</a>
    <p>Please address the feedback and resubmit your revised proposal.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: studentEmail,
    subject: `Revision Required: ${projectTitle}`,
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

const sendMilestoneNotification = async (email, username, milestoneTitle, deadline, isReminder = false) => {
  const content = `
    <h2>${isReminder ? '⏰ Deadline Approaching' : '🚀 New Milestone Released'}</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>${isReminder 
      ? `This is a reminder that the deadline for <strong>${milestoneTitle}</strong> is approaching.` 
      : `A new milestone <strong>${milestoneTitle}</strong> has been released for your FYP track.`
    }</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Milestone:</strong> ${milestoneTitle}</p>
      <p style="margin: 10px 0 0 0;"><strong>Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>
    </div>
    <a href="${process.env.FRONTEND_URL}/milestones" class="button">View Milestone</a>
    <p>Please ensure you submit your work before the deadline to avoid late flags.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `${isReminder ? 'Reminder:' : 'New Task:'} ${milestoneTitle} - FYPMS`,
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Milestone notification error:', error);
    // Don't throw, just log
    return false;
  }
};

// Committee Assignment Email
const sendCommitteeAssignmentEmail = async (email, username, evalDate) => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/committee/evaluate`;
  
  const content = `
    <h2>Evaluation Session Assignment</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>You have been assigned as a committee member for an upcoming evaluation session.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Evaluation Date:</strong> ${evalDate}</p>
      <p><strong>Dashboard:</strong> <a href="${dashboardUrl}">Evaluation Portal</a></p>
    </div>
    <p>Please log in to your dashboard to view the groups assigned to you and their respective time slots.</p>
    <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Assignment: Evaluation Session Committee - Smart FYPMS',
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Committee Email error:', error);
  }
};

// Student Time Slot Email
const sendStudentTimeSlotEmail = async (email, username, projectTitle, evalDate, startTime, endTime) => {
  const content = `
    <h2>Evaluation Session Schedule</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>Your group presentation for <strong>${projectTitle}</strong> has been scheduled.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Date:</strong> ${evalDate}</p>
      <p><strong>Time Slot:</strong> ${startTime} - ${endTime}</p>
    </div>
    <p>Please ensure all group members are present at least 10 minutes before the scheduled time.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Scheduled: FYP Evaluation Session - Smart FYPMS',
    html: emailTemplate(content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Student Time Slot Email error:', error);
  }
};

async function sendEvaluationSessionEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err.message);
  }
}

module.exports = {
  sendEvaluationSessionEmail,
  sendPasswordResetEmail,
  sendAccountCreationEmail,
  sendSecurityChallengeEmail,
  sendPasswordChangedEmail,
  sendProposalSubmittedEmail,
  sendProposalApprovedEmail,
  sendProposalRejectedEmail,
  sendRevisionRequestedEmail,
  sendMilestoneNotification,
  sendCommitteeAssignmentEmail,
  sendStudentTimeSlotEmail
};
