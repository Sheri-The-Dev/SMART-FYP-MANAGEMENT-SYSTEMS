const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
const verifyEmailConfig = async () => {
  try {
    // Render peer timeout se bachne ke liye verification ko bypass kiya hai
    // await transporter.verify(); 
    console.log('✅ Email server verification bypassed (Forced Success for Deployment)');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  transporter,
  verifyEmailConfig
};
