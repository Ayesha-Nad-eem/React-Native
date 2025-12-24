const nodemailer = require("nodemailer");

// Create reusable transporter
const createTransporter = () => {
  // Using Gmail as example. You can use any SMTP service
  // For Gmail, you need to:
  // 1. Enable 2-factor authentication
  // 2. Generate an "App Password" from Google Account settings
  // 3. Use that app password instead of your regular password

  const config = {
    service: process.env.EMAIL_SERVICE || "gmail", // or 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASSWORD, // Your email password or app password
    },
  };

  // Alternative: Using custom SMTP settings
  // const config = {
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT || 587,
  //   secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASSWORD,
  //   },
  // };

  return nodemailer.createTransport(config);
};

// Send invoice email
const sendInvoiceEmail = async (bookingData) => {
  try {
    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();
    console.log("✅ Email server is ready to send messages");

    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 20px;
            border: 1px solid #e5e7eb;
          }
          .section {
            margin-bottom: 20px;
            background-color: white;
            padding: 15px;
            border-radius: 6px;
          }
          .section-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .info-row {
            margin: 5px 0;
            padding: 5px 0;
          }
          .label {
            font-weight: 600;
            color: #4b5563;
          }
          .value {
            color: #1f2937;
          }
          .total {
            background-color: #dbeafe;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            text-align: center;
          }
          .total-amount {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚗 Booking Invoice</h1>
          <p>Thank you for your booking!</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">Booking Information</div>
            <div class="info-row">
              <span class="label">Booking ID:</span> 
              <span class="value">${bookingData.bookingId}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span> 
              <span class="value">Confirmed</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Customer Details</div>
            <div class="info-row">
              <span class="label">Name:</span> 
              <span class="value">${bookingData.customerName}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span> 
              <span class="value">${bookingData.customerEmail}</span>
            </div>
            <div class="info-row">
              <span class="label">Phone:</span> 
              <span class="value">${bookingData.customerPhone}</span>
            </div>
            <div class="info-row">
              <span class="label">Address:</span> 
              <span class="value">${bookingData.customerAddress}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Trip Details</div>
            <div class="info-row">
              <span class="label">Pickup:</span> 
              <span class="value">${bookingData.pickup}</span>
            </div>
            <div class="info-row">
              <span class="label">Dropoff:</span> 
              <span class="value">${bookingData.dropoff}</span>
            </div>
            <div class="info-row">
              <span class="label">Date & Time:</span> 
              <span class="value">${bookingData.date} at ${bookingData.time}</span>
            </div>
            <div class="info-row">
              <span class="label">Duration:</span> 
              <span class="value">${bookingData.hours} hour(s)</span>
            </div>
            <div class="info-row">
              <span class="label">Passengers:</span> 
              <span class="value">${bookingData.passengers}</span>
            </div>
            <div class="info-row">
              <span class="label">Transfer Type:</span> 
              <span class="value">${bookingData.transferType === "one-way" ? "One Way" : "Two Way"}</span>
            </div>
            <div class="info-row">
              <span class="label">Distance:</span> 
              <span class="value">${bookingData.distanceKm} km</span>
            </div>
            <div class="info-row">
              <span class="label">Estimated Duration:</span> 
              <span class="value">${bookingData.durationMin} minutes</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Vehicle</div>
            <div class="info-row">
              <span class="label">Model:</span> 
              <span class="value">${bookingData.vehicleName}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Fare Breakdown</div>
            <div class="info-row">
              <span class="label">Base Fare:</span> 
              <span class="value">$${bookingData.baseFare.toFixed(2)}</span>
            </div>
          </div>

          <div class="total">
            <p style="margin: 0; font-size: 16px; color: #4b5563;">Total Amount</p>
            <div class="total-amount">$${bookingData.totalFare.toFixed(2)}</div>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>&copy; ${new Date().getFullYear()} Chauffeur Service. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Plain text version for email clients that don't support HTML
    const textContent = `
BOOKING INVOICE
===============

Booking ID: ${bookingData.bookingId}
Status: Confirmed

CUSTOMER DETAILS
----------------
Name: ${bookingData.customerName}
Email: ${bookingData.customerEmail}
Phone: ${bookingData.customerPhone}
Address: ${bookingData.customerAddress}

TRIP DETAILS
------------
Pickup: ${bookingData.pickup}
Dropoff: ${bookingData.dropoff}
Date & Time: ${bookingData.date} at ${bookingData.time}
Duration: ${bookingData.hours} hour(s)
Passengers: ${bookingData.passengers}
Transfer Type: ${bookingData.transferType === "one-way" ? "One Way" : "Two Way"}
Distance: ${bookingData.distanceKm} km
Estimated Duration: ${bookingData.durationMin} minutes

VEHICLE
-------
Model: ${bookingData.vehicleName}

FARE BREAKDOWN
--------------
Base Fare: $${bookingData.baseFare.toFixed(2)}
Total Amount: $${bookingData.totalFare.toFixed(2)}

This is an automated email. Please do not reply.
If you have any questions, please contact our support team.

© ${new Date().getFullYear()} Chauffeur Service. All rights reserved.
    `;

    // Send email
    const mailOptions = {
      from: `"Chauffeur Service" <${process.env.EMAIL_USER}>`,
      to: bookingData.customerEmail,
      subject: `Booking Confirmation - Invoice #${bookingData.bookingId}`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      recipient: bookingData.customerEmail,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  sendInvoiceEmail,
  createTransporter,
};
