require("dotenv").config();

const morgan = require("morgan");

const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));

// For Stripe webhook, we need raw body, so we handle it before json middleware
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

// JSON middleware for all other routes
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const marketRoutes = require("./routes/market");
const tradeRoutes = require("./routes/trade");
const paymentRoutes = require("./routes/payment");

app.use("/api/auth", authRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/payment", paymentRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
