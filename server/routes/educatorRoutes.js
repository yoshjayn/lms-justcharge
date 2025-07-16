import express from 'express'
import { 
    toggleCourseStatus, 
    addCourse, 
    educatorDashboardData, 
    getEducatorCourses, 
    getEnrolledStudentsData, 
    updateRoleToEducator,
    getPendingEnrollments,
    processEnrollmentRequest
} from '../controllers/educatorController.js';
import upload from '../configs/multer.js';
import { protectEducator } from '../middlewares/authMiddleware.js';

const educatorRouter = express.Router()

// Existing Educator Routes
educatorRouter.patch('/toggle-course-status', protectEducator, toggleCourseStatus)
educatorRouter.get('/update-role', updateRoleToEducator)
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)

// Pending Enrollments Routes (for Students Enrolled page)
educatorRouter.get('/pending-enrollments', protectEducator, getPendingEnrollments)
educatorRouter.post('/process-enrollment/:enrollmentId', protectEducator, processEnrollmentRequest)

export default educatorRouter;