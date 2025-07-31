import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  studentId: { type: String, ref: 'User', default: null }, // null for website bookings
  educatorId: { type: String, ref: 'User', required: true },
  serviceType: { type: String, required: true },
  selectedDate: { type: Date, required: true },
  selectedTime: { type: String, required: true },
  duration: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
  
  // Payment information
  paymentDetails: {
    transactionId: { type: String, required: true },
    screenshotUrl: String,
    paymentStatus: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' }
  },
  
  // Contact details
  contactDetails: {
    whatsappNumber: { type: String, required: true },
    email: String,
    addedToWhatsAppGroup: { type: Boolean, default: false }
  },
  
  // For website bookings - customer info
  customerName: { type: String }, // For display purposes
  customerInfo: {
    name: String,
    whatsappNumber: String,
    dateOfBirth: Date,
    placeOfBirth: String,
    timeOfBirth: String
  },
  
  // Session information (for website bookings)
  sessionInfo: {
    service: String,
    date: Date,
    time: String,
    duration: String,
    amount: Number
  },
  
  // Payment info (for website bookings)
  paymentInfo: {
    transactionId: String,
    screenshotUrl: String
  },
  
  // Flags
  isWebsiteBooking: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

// Index for efficient queries
bookingSchema.index({ educatorId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ selectedDate: 1, selectedTime: 1 });

export default mongoose.model('Booking', bookingSchema);