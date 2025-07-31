import express from 'express';
import {
  getAvailableSlots,
  createBooking,
  createWebsiteBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  getPendingBookings, 
  processBookingRequest, 
  manageTimeSlot, 
  getEducatorSchedule,
  deleteBookings
} from '../controllers/bookingController.js';
import upload from '../configs/multer.js';
import { protectUser, protectEducator } from '../middlewares/authMiddleware.js';

const bookingRouter = express.Router();

// PUBLIC ROUTES (No authentication needed)
bookingRouter.get('/available-slots/:date', getAvailableSlots);
bookingRouter.post('/create-website-booking', upload.single('screenshot'), createWebsiteBooking);

// USER ROUTES (Require user authentication)
bookingRouter.post('/create', protectUser, upload.single('screenshot'), createBooking);
bookingRouter.get('/my-bookings', protectUser, getUserBookings);
bookingRouter.patch('/cancel/:bookingId', protectUser, cancelBooking);

// EDUCATOR ROUTES (Require educator authentication)
bookingRouter.get('/pending-bookings', protectEducator, getPendingBookings);
bookingRouter.post('/process-booking/:bookingId', protectEducator, processBookingRequest);
bookingRouter.post('/manage-slot', protectEducator, manageTimeSlot);
bookingRouter.get('/educator-schedule', protectEducator, getEducatorSchedule);
bookingRouter.get('/all', protectEducator, getAllBookings);
bookingRouter.patch('/update/:bookingId', protectEducator, updateBookingStatus);

bookingRouter.get('/cleanup/website-bookings', protectEducator, deleteBookings);

export default bookingRouter;