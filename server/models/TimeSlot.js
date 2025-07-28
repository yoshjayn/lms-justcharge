import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  educatorId: { type: String, ref: 'User', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  blockReason: String,
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  createdAt: { type: Date, default: Date.now }
});

timeSlotSchema.index({ educatorId: 1, date: 1, timeSlot: 1 }, { unique: true });

export default mongoose.model('TimeSlot', timeSlotSchema);