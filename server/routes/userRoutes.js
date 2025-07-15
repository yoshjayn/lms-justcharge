import express from 'express'
import { submitQRPaymentEnrollment, checkEnrollmentStatus, addUserRating, getUserCourseProgress, getUserData, purchaseCourse, updateUserCourseProgress, userEnrolledCourses } from '../controllers/userController.js';
import upload from '../configs/multer.js'; 
import { protectUser } from '../middlewares/authMiddleware.js';

const userRouter = express.Router()
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});
// QR Code payment enrollment
userRouter.post('/enroll-qr', upload.single('screenshot'), protectUser, submitQRPaymentEnrollment);

// Check enrollment status
userRouter.get('/enrollment-status/:courseId', protectUser, checkEnrollmentStatus);

// Get user Data
userRouter.get('/data', getUserData)
userRouter.post('/purchase', purchaseCourse)
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post('/get-course-progress', getUserCourseProgress)
userRouter.post('/add-rating', addUserRating)

export default userRouter;