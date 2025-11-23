const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // For development, use a test account or console logging
  // For production, use real SMTP credentials from environment variables

  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else if (process.env.EMAIL_SERVICE === 'smtp') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // For development without email config, log to console
    return nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }
};

/**
 * Send account suspension notification email
 */
async function sendSuspensionEmail(userData, suspensionData) {
  try {
    const { email, full_name } = userData;
    const { reason, suspendedUntil, isPermanent } = suspensionData;

    const transporter = createTransporter();

    const durationText = isPermanent
      ? 'permanently'
      : `until ${new Date(suspendedUntil).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"ThuLoBazaar" <noreply@thulobazaar.com>',
      to: email,
      subject: 'Account Suspension Notification - ThuLoBazaar',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .alert-box {
              background: #fee2e2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .reason-box {
              background: white;
              border: 1px solid #e5e7eb;
              padding: 15px;
              margin: 20px 0;
              border-radius: 6px;
            }
            .info-label {
              font-weight: 600;
              color: #6b7280;
              font-size: 13px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .info-value {
              color: #111827;
              font-size: 16px;
            }
            .footer {
              background: #111827;
              color: #9ca3af;
              padding: 20px;
              border-radius: 0 0 10px 10px;
              text-align: center;
              font-size: 13px;
            }
            .button {
              display: inline-block;
              background: #14b8a6;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Account Suspended</h1>
          </div>

          <div class="content">
            <p style="font-size: 16px;">Dear <strong>${full_name}</strong>,</p>

            <div class="alert-box">
              <p style="margin: 0; font-weight: 600; color: #dc2626;">
                Your ThuLoBazaar account has been suspended ${durationText}.
              </p>
            </div>

            <p>We regret to inform you that your account has been temporarily restricted due to a violation of our platform policies.</p>

            <div class="reason-box">
              <div class="info-label">Reason for Suspension</div>
              <div class="info-value">${reason}</div>
            </div>

            ${!isPermanent ? `
            <div class="reason-box">
              <div class="info-label">Suspension End Date</div>
              <div class="info-value">${new Date(suspendedUntil).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</div>
            </div>
            ` : ''}

            <h3 style="color: #111827; margin-top: 30px;">What This Means</h3>
            <ul style="color: #4b5563;">
              <li>You cannot log in to your account during the suspension period</li>
              <li>Your active ads have been hidden from the marketplace</li>
              <li>You cannot post new ads or manage existing ones</li>
              ${isPermanent ? '<li>This suspension is permanent unless appealed successfully</li>' : '<li>Your account will be automatically restored after the suspension period</li>'}
            </ul>

            <h3 style="color: #111827; margin-top: 30px;">If You Believe This Is a Mistake</h3>
            <p>If you believe this suspension was issued in error or would like to appeal, please contact our support team:</p>

            <p style="text-align: center;">
              <a href="mailto:support@thulobazaar.com" class="button">Contact Support</a>
            </p>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Please review our <a href="${process.env.FRONTEND_URL || 'http://localhost:3333'}/terms" style="color: #14b8a6;">Terms of Service</a>
              and <a href="${process.env.FRONTEND_URL || 'http://localhost:3333'}/community-guidelines" style="color: #14b8a6;">Community Guidelines</a>
              to understand our platform policies.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} ThuLoBazaar. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Nepal's Premier Online Marketplace</p>
          </div>
        </body>
        </html>
      `,
      text: `
Account Suspension Notification - ThuLoBazaar

Dear ${full_name},

Your ThuLoBazaar account has been suspended ${durationText}.

REASON FOR SUSPENSION:
${reason}

${!isPermanent ? `SUSPENSION END DATE: ${new Date(suspendedUntil).toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})}` : 'This suspension is permanent.'}

WHAT THIS MEANS:
- You cannot log in to your account during the suspension period
- Your active ads have been hidden from the marketplace
- You cannot post new ads or manage existing ones
${isPermanent ? '- This suspension is permanent unless appealed successfully' : '- Your account will be automatically restored after the suspension period'}

IF YOU BELIEVE THIS IS A MISTAKE:
Please contact our support team at support@thulobazaar.com

---
© ${new Date().getFullYear()} ThuLoBazaar. All rights reserved.
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);

    // If using streamTransport (development), log the message
    if (!process.env.EMAIL_SERVICE) {
      console.log('\n=== EMAIL WOULD BE SENT ===');
      console.log('To:', email);
      console.log('Subject:', mailOptions.subject);
      console.log('Preview:', info.message.toString());
      console.log('===========================\n');
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending suspension email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send account unsuspension notification email
 */
async function sendUnsuspensionEmail(userData) {
  try {
    const { email, full_name } = userData;

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"ThuLoBazaar" <noreply@thulobazaar.com>',
      to: email,
      subject: 'Account Restored - Welcome Back to ThuLoBazaar',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .success-box {
              background: #d1fae5;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #111827;
              color: #9ca3af;
              padding: 20px;
              border-radius: 0 0 10px 10px;
              text-align: center;
              font-size: 13px;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">✓ Account Restored</h1>
          </div>

          <div class="content">
            <p style="font-size: 16px;">Dear <strong>${full_name}</strong>,</p>

            <div class="success-box">
              <p style="margin: 0; font-weight: 600; color: #059669;">
                Great news! Your ThuLoBazaar account has been fully restored.
              </p>
            </div>

            <p>Your account suspension has been lifted, and you now have full access to all ThuLoBazaar features.</p>

            <h3 style="color: #111827; margin-top: 30px;">You Can Now</h3>
            <ul style="color: #4b5563;">
              <li>Log in to your account</li>
              <li>Post and manage your ads</li>
              <li>Browse and purchase items</li>
              <li>Contact sellers and respond to buyers</li>
              <li>Access all marketplace features</li>
            </ul>

            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3333'}/en/login" class="button">Log In to Your Account</a>
            </p>

            <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; color: #92400e;">
              <strong>Please Note:</strong> To maintain your account in good standing, please ensure you follow our
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3333'}/terms" style="color: #92400e; text-decoration: underline;">Terms of Service</a>
              and <a href="${process.env.FRONTEND_URL || 'http://localhost:3333'}/community-guidelines" style="color: #92400e; text-decoration: underline;">Community Guidelines</a>.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} ThuLoBazaar. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Nepal's Premier Online Marketplace</p>
          </div>
        </body>
        </html>
      `,
      text: `
Account Restored - Welcome Back to ThuLoBazaar

Dear ${full_name},

Great news! Your ThuLoBazaar account has been fully restored.

Your account suspension has been lifted, and you now have full access to all ThuLoBazaar features.

YOU CAN NOW:
- Log in to your account
- Post and manage your ads
- Browse and purchase items
- Contact sellers and respond to buyers
- Access all marketplace features

Log in at: ${process.env.FRONTEND_URL || 'http://localhost:3333'}/en/login

PLEASE NOTE: To maintain your account in good standing, please ensure you follow our Terms of Service and Community Guidelines.

---
© ${new Date().getFullYear()} ThuLoBazaar. All rights reserved.
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);

    if (!process.env.EMAIL_SERVICE) {
      console.log('\n=== EMAIL WOULD BE SENT ===');
      console.log('To:', email);
      console.log('Subject:', mailOptions.subject);
      console.log('===========================\n');
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending unsuspension email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  sendSuspensionEmail,
  sendUnsuspensionEmail,
};
