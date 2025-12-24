const express = require("express");
const router = express.Router();
const { sendInvoiceEmail } = require("../config/email");

// Send invoice email without database - just email the booking details
router.post("/send-invoice", async (req, res) => {
  try {
    const bookingData = req.body;

    // Validate required fields
    if (!bookingData.customerEmail || !bookingData.customerName) {
      return res.status(400).json({ error: "Missing customer details" });
    }

    // Send email using Nodemailer
    console.log("Sending invoice email to:", bookingData.customerEmail);
    const emailResult = await sendInvoiceEmail(bookingData);

    console.log("Invoice email sent successfully:", emailResult.messageId);

    res.json({
      success: true,
      message: "Invoice sent successfully to " + bookingData.customerEmail,
      emailMessageId: emailResult.messageId,
    });
  } catch (error) {
    console.error("Invoice sending error:", error);
    res.status(500).json({ 
      error: error.message,
      details: "Failed to send invoice email. Please check email configuration."
    });
  }
});

module.exports = router;
