#!/usr/bin/env node

/**
 * ThuLoBazaar Email Configuration Test
 *
 * This script tests your SMTP configuration to ensure emails can be sent.
 * Run: node test-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

async function testEmailConfiguration() {
  log('\n========================================', colors.cyan);
  log('  ThuLoBazaar Email Configuration Test', colors.bright);
  log('========================================\n', colors.cyan);

  // Check if .env variables are set
  log('📋 Checking configuration...', colors.blue);

  const config = {
    service: process.env.EMAIL_SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD ? '***hidden***' : undefined,
    from: process.env.EMAIL_FROM,
  };

  console.log('Current configuration:');
  console.log(JSON.stringify(config, null, 2));
  console.log('');

  // Validate configuration
  if (!process.env.EMAIL_SERVICE) {
    log('⚠️  EMAIL_SERVICE is not set. Emails will be logged to console only.', colors.yellow);
    log('   To send real emails, set EMAIL_SERVICE=smtp in .env\n', colors.yellow);
    return;
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    log('❌ Error: SMTP_HOST and SMTP_PORT must be set in .env', colors.red);
    process.exit(1);
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    log('❌ Error: SMTP_USER and SMTP_PASSWORD must be set in .env', colors.red);
    process.exit(1);
  }

  // Create transporter
  log('🔧 Creating SMTP transporter...', colors.blue);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true, // Show SMTP traffic
  });

  // Test 1: Verify connection
  log('\n🔍 Test 1: Verifying SMTP connection...', colors.blue);
  try {
    await transporter.verify();
    log('✅ SMTP connection successful!', colors.green);
  } catch (error) {
    log('❌ SMTP connection failed:', colors.red);
    log('   ' + error.message, colors.red);
    log('\n💡 Tips:', colors.yellow);
    log('   - Check SMTP_HOST and SMTP_PORT in .env', colors.yellow);
    log('   - Verify credentials are correct', colors.yellow);
    log('   - Try port 587 instead of 465 (or vice versa)', colors.yellow);
    log('   - Check if SMTP_SECURE matches your port (true for 465, false for 587)', colors.yellow);
    process.exit(1);
  }

  // Test 2: Send test email
  log('\n📧 Test 2: Sending test email...', colors.blue);

  // Get recipient email
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const recipientEmail = await new Promise((resolve) => {
    readline.question('Enter your email address to receive test email: ', (answer) => {
      readline.close();
      resolve(answer.trim());
    });
  });

  if (!recipientEmail || !recipientEmail.includes('@')) {
    log('❌ Invalid email address', colors.red);
    process.exit(1);
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: '✅ ThuLoBazaar Email Test - Configuration Successful',
      text: `
Congratulations!

Your ThuLoBazaar email configuration is working correctly.

SMTP Configuration:
- Host: ${process.env.SMTP_HOST}
- Port: ${process.env.SMTP_PORT}
- Secure: ${process.env.SMTP_SECURE}
- User: ${process.env.SMTP_USER}

This email was sent from your automated email system.
User suspension and unsuspension emails will now be sent successfully.

---
ThuLoBazaar Automated Email System
      `.trim(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
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
            .config-table {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              margin: 20px 0;
            }
            .config-table tr {
              border-bottom: 1px solid #e5e7eb;
            }
            .config-table tr:last-child {
              border-bottom: none;
            }
            .config-table td {
              padding: 12px 15px;
            }
            .config-table td:first-child {
              font-weight: 600;
              color: #6b7280;
              width: 120px;
            }
            .footer {
              background: #111827;
              color: #9ca3af;
              padding: 20px;
              border-radius: 0 0 10px 10px;
              text-align: center;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">✅ Email Test Successful</h1>
          </div>

          <div class="content">
            <div class="success-box">
              <p style="margin: 0; font-weight: 600; color: #059669;">
                Congratulations! Your ThuLoBazaar email configuration is working correctly.
              </p>
            </div>

            <p>This is a test email to verify that your SMTP settings are configured properly.</p>

            <h3 style="color: #111827; margin-top: 30px;">Current Configuration</h3>
            <table class="config-table" width="100%">
              <tr>
                <td>SMTP Host</td>
                <td>${process.env.SMTP_HOST}</td>
              </tr>
              <tr>
                <td>SMTP Port</td>
                <td>${process.env.SMTP_PORT}</td>
              </tr>
              <tr>
                <td>Secure</td>
                <td>${process.env.SMTP_SECURE === 'true' ? 'Yes (SSL/TLS)' : 'No (STARTTLS)'}</td>
              </tr>
              <tr>
                <td>Sender</td>
                <td>${process.env.SMTP_USER}</td>
              </tr>
            </table>

            <h3 style="color: #111827; margin-top: 30px;">What This Means</h3>
            <ul style="color: #4b5563;">
              <li>User suspension emails will be sent successfully</li>
              <li>User unsuspension emails will be sent successfully</li>
              <li>All automated notifications are working</li>
              <li>No further configuration needed</li>
            </ul>

            <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; color: #92400e;">
              <strong>Next Steps:</strong> Your email system is ready to use! Try suspending a test user from the Editor Dashboard to see the full suspension email template.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">ThuLoBazaar Automated Email System</p>
            <p style="margin: 5px 0 0 0;">Nepal's Premier Online Marketplace</p>
          </div>
        </body>
        </html>
      `,
    });

    log('\n✅ Test email sent successfully!', colors.green);
    log(`📬 Message ID: ${info.messageId}`, colors.green);
    log(`📧 Sent to: ${recipientEmail}`, colors.green);

    log('\n💡 Next Steps:', colors.yellow);
    log('   1. Check your email inbox (and spam folder)', colors.yellow);
    log('   2. If you received the email, your configuration is correct!', colors.yellow);
    log('   3. Try suspending a test user to see the full email template', colors.yellow);

  } catch (error) {
    log('\n❌ Failed to send test email:', colors.red);
    log('   ' + error.message, colors.red);

    if (error.code === 'EAUTH') {
      log('\n💡 Authentication Error - Check:', colors.yellow);
      log('   - SMTP_USER must be your full email: user@domain.com', colors.yellow);
      log('   - SMTP_PASSWORD is correct', colors.yellow);
      log('   - Email account exists in your hosting', colors.yellow);
    } else if (error.code === 'ECONNECTION') {
      log('\n💡 Connection Error - Check:', colors.yellow);
      log('   - SMTP_HOST is correct', colors.yellow);
      log('   - SMTP_PORT is correct (try 587 or 465)', colors.yellow);
      log('   - Your hosting allows SMTP connections', colors.yellow);
    } else if (error.responseCode === 550) {
      log('\n💡 Sender Rejected - Check:', colors.yellow);
      log('   - EMAIL_FROM matches SMTP_USER or is an authorized alias', colors.yellow);
      log('   - Domain is verified in your hosting', colors.yellow);
    }

    process.exit(1);
  }

  log('\n========================================', colors.cyan);
  log('  Test Complete!', colors.bright);
  log('========================================\n', colors.cyan);
}

// Run the test
testEmailConfiguration().catch((error) => {
  log('\n❌ Unexpected error:', colors.red);
  console.error(error);
  process.exit(1);
});
