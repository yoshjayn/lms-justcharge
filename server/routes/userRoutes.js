import express from 'express'
import { 
    submitQRPaymentEnrollment, 
    checkEnrollmentStatus, 
    getMyPendingEnrollments,
    removeRejectedEnrollment,  // ADD THIS LINE
    addUserRating, 
    getUserCourseProgress, 
    getUserData, 
    purchaseCourse, 
    updateUserCourseProgress, 
    userEnrolledCourses 
} from '../controllers/userController.js';
import upload from '../configs/multer.js'; 
import { protectUser } from '../middlewares/authMiddleware.js';

const userRouter = express.Router()

// QR Code payment enrollment
userRouter.post('/enroll-qr', protectUser, upload.single('screenshot'), submitQRPaymentEnrollment);

// Check enrollment status
userRouter.get('/enrollment-status/:courseId', protectUser, checkEnrollmentStatus);

// Get user's pending enrollments
userRouter.get('/my-pending-enrollments', protectUser, getMyPendingEnrollments);

// Remove rejected enrollment - ADD THIS LINE
userRouter.delete('/remove-rejected-enrollment/:enrollmentId', protectUser, removeRejectedEnrollment);

// User routes
userRouter.get('/data', getUserData)
userRouter.post('/purchase', purchaseCourse)
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post('/get-course-progress', getUserCourseProgress)
userRouter.post('/add-rating', addUserRating)

export default userRouter;