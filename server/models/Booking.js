import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  studentId: { type: String, ref: 'User', required: true },
  educatorId: { type: String, ref: 'User', required: true },
  serviceType: { type: String, required: true },
  selectedDate: { type: Date, required: true },
  selectedTime: { type: String, required: true },
  duration: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
  paymentDetails: {
    transactionId: { type: String, required: true },
    screenshotUrl: String,
    paymentStatus: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' }
  },
  contactDetails: {
    whatsappNumber: { type: String, required: true },
    email: String,
    addedToWhatsAppGroup: { type: Boolean, default: false }
  },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Booking', bookingSchema);