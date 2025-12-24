const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Trip Details (Step 1)
  pickup: {
    type: String,
    required: true,
  },
  dropoff: {
    type: String,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  passengers: {
    type: Number,
    required: true,
  },
  transferType: {
    type: String,
    enum: ['one-way', 'two-way'],
    required: true,
  },
  
  // Vehicle Details (Step 2)
  vehicleId: {
    type: String,
    required: true,
  },
  vehicleName: {
    type: String,
    required: true,
  },
  vehicleRate: {
    type: Number,
    required: true,
  },
  
  // Customer Info (Step 3)
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  customerAddress: {
    type: String,
    required: true,
  },
  
  // Calculated amounts
  distanceKm: {
    type: Number,
    default: 0,
  },
  durationMin: {
    type: Number,
    default: 0,
  },
  baseFare: {
    type: Number,
    required: true,
  },
  totalFare: {
    type: Number,
    required: true,
  },
  
  // Booking status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  
  // Invoice tracking
  invoiceSent: {
    type: Boolean,
    default: false,
  },
  invoiceSentAt: {
    type: Date,
  },
  
  // Metadata
  createdBy: {
    type: String,
    default: 'admin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
