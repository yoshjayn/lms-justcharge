import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  // Educator info - SIMPLIFIED (static value for single educator)
  educatorId: { type: String, ref: 'User', required: true, default: 'single-educator' },
  
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  blockReason: String,
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  createdAt: { type: Date, default: Date.now }
});

// SIMPLIFIED index - removed educatorId uniqueness since it's always the same
timeSlotSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

export default mongoose.model('TimeSlot', timeSlotSchema);