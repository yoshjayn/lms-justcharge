import express from 'express';
import { getPendingEnrollments, processEnrollmentRequest } from '../controllers/adminController.js';
import { protectAdmin } from '../middlewares/authMiddleware.js';

const adminRouter = express.Router();

// Get pending enrollments
adminRouter.get('/pending-enrollments', protectAdmin, getPendingEnrollments);

// Process enrollment request (approve/reject)
adminRouter.post('/process-enrollment/:enrollmentId', protectAdmin, processEnrollmentRequest);

export default adminRouter;