import PendingEnrollment from '../models/PendingEnrollment.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import {Purchase} from '../models/Purchase.js';


export const getPendingEnrollments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query;

    const pendingEnrollments = await PendingEnrollment.find({ status })
      .populate('userId', 'name email imageUrl')
      .populate('courseId', 'courseTitle courseThumbnail price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PendingEnrollment.countDocuments({ status });

    res.json({
      success: true,
      enrollments: pendingEnrollments,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const processEnrollmentRequest = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'
    const adminId = req.auth.userId;

    const pendingEnrollment = await PendingEnrollment.findById(enrollmentId);

    if (!pendingEnrollment) {
      return res.json({ success: false, message: 'Enrollment request not found' });
    }

    if (pendingEnrollment.status !== 'pending') {
      return res.json({ success: false, message: 'Enrollment request already processed' });
    }

    if (action === 'approve') {
      // Approve the enrollment
      const userData = await User.findById(pendingEnrollment.userId);
      const courseData = await Course.findById(pendingEnrollment.courseId);

      // Add user to course
      courseData.enrolledStudents.push(userData._id);
      await courseData.save();

      // Add course to user
      userData.enrolledCourses.push(courseData._id);
      await userData.save();

      // Create purchase record for tracking
      await Purchase.create({
        userId: pendingEnrollment.userId,
        courseId: pendingEnrollment.courseId,
        amount: courseData.price,
        status: 'completed',
        paymentMethod: 'qr_code',
        transactionId: pendingEnrollment.transactionId
      });

      // Update pending enrollment
      pendingEnrollment.status = 'approved';
      pendingEnrollment.processedAt = new Date();
      pendingEnrollment.processedBy = adminId;
      await pendingEnrollment.save();

      res.json({ success: true, message: 'Enrollment approved successfully' });

    } else if (action === 'reject') {
      // Reject the enrollment
      pendingEnrollment.status = 'rejected';
      pendingEnrollment.processedAt = new Date();
      pendingEnrollment.processedBy = adminId;
      pendingEnrollment.rejectionReason = rejectionReason || 'No reason provided';
      await pendingEnrollment.save();

      res.json({ success: true, message: 'Enrollment rejected successfully' });

    } else {
      res.json({ success: false, message: 'Invalid action' });
    }

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};