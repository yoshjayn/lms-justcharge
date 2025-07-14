import mongoose from 'mongoose';

const pendingEnrollmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Course'
  },
  paymentScreenshot: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: String,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('PendingEnrollment', pendingEnrollmentSchema);
