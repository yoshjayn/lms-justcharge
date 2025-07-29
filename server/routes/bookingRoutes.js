import express from 'express';
import {
  getAvailableSlots,
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  getPendingBookings, 
    processBookingRequest, 
    manageTimeSlot, 
    getEducatorSchedule
} from '../controllers/bookingController.js';
import upload from '../configs/multer.js';
import { protectUser, protectEducator } from '../middlewares/authMiddleware.js';

const bookingRouter = express.Router();

// Educator routes (Authentication Required)
bookingRouter.get('/pending-bookings', protectEducator, getPendingBookings);
bookingRouter.post('/process-booking/:bookingId', protectEducator, processBookingRequest);
bookingRouter.post('/manage-slot', protectEducator, manageTimeSlot); // This is the route your calendar needs
bookingRouter.get('/educator-schedule', protectEducator, getEducatorSchedule);


// ✅ PUBLIC ROUTES (No authentication needed)
// Get available slots for a date - This is what your frontend is calling
bookingRouter.get('/available-slots/:date', getAvailableSlots);

// ✅ USER ROUTES (Require user authentication)
// Create a new booking with QR payment screenshot
bookingRouter.post('/create', protectUser, upload.single('screenshot'), createBooking);

// Get user's own bookings
bookingRouter.get('/my-bookings', protectUser, getUserBookings);

// Cancel a booking (user can only cancel their own)
bookingRouter.patch('/cancel/:bookingId', protectUser, cancelBooking);

// ✅ ADMIN/EDUCATOR ROUTES (Require educator authentication)
// Get all bookings with filters (admin only)
bookingRouter.get('/all', protectEducator, getAllBookings);

// Update booking status (admin only)
bookingRouter.patch('/update/:bookingId', protectEducator, updateBookingStatus);

export default bookingRouter;







