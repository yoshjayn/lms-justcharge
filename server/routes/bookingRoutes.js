// server/routes/bookingRoutes.js
import express from 'express';
import { 
    // Educator Functions (Auth Required)
    getPendingBookings, 
    processBookingRequest, 
    manageTimeSlot, 
    getEducatorSchedule,
    
    // Website Functions (No Auth Required)
    getAvailableSlotsWebsite,
    createBookingWebsite
} from '../controllers/bookingController.js';
import { protectEducator } from '../middlewares/authMiddleware.js';
import upload from '../configs/multer.js';

const bookingRouter = express.Router();

// ===== EDUCATOR ROUTES (Authentication Required) =====
bookingRouter.get('/pending-bookings', protectEducator, getPendingBookings);
bookingRouter.post('/process-booking/:bookingId', protectEducator, processBookingRequest);
bookingRouter.post('/manage-slot', protectEducator, manageTimeSlot);
bookingRouter.get('/educator-schedule', protectEducator, getEducatorSchedule);

// ===== WEBSITE ROUTES (No Authentication Required) =====
bookingRouter.get('/available-slots/:date', getAvailableSlotsWebsite);
bookingRouter.post('/create-booking-website', upload.single('screenshot'), createBookingWebsite);

export default bookingRouter;