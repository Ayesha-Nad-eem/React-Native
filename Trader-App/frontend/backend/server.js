require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// create email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS, 
  },
});

// route to send booking email
app.post("/book/send-email", async (req, res) => {
  const { name, email, car, fare, pickup, dropoff } = req.body;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your Booking Confirmation – Trader App",
    html: `
      <h2>Booking Confirmed!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your booking has been confirmed.</p>
      <p><strong>Car:</strong> ${car}</p>
      <p><strong>Total Fare:</strong> $${fare}</p>
      <p><strong>Pickup:</strong> ${pickup}</p>
      <p><strong>Dropoff:</strong> ${dropoff}</p>
      <br/>
      <p>Thank you for choosing our service.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Email sending failed" });
  }
});

// start server
app.listen(5000, () => console.log("Server running on port 5000"));
