import Booking from '../models/Booking.js';
import TimeSlot from '../models/TimeSlot.js';
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';

// Get pending bookings for educator
export const getPendingBookings = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        console.log('📋 Fetching pending bookings for educator:', educatorId);

        const pendingBookings = await Booking.find({
            educatorId,
            status: 'pending'
        })
        .populate('studentId', 'name email imageUrl createdAt')
        .sort({ createdAt: -1 });

        console.log('📊 Found pending bookings:', pendingBookings.length);

        res.json({ 
            success: true, 
            bookings: pendingBookings 
        });

    } catch (error) {
        console.error('Get pending bookings error:', error);
        res.json({ success: false, message: 'Error fetching pending bookings' });
    }
};

// Block/unblock time slot - THIS IS THE FUNCTION YOUR CALENDAR NEEDS
export const manageTimeSlot = async (req, res) => {
    try {
        const { date, timeSlot, isBlocked, blockReason } = req.body;
        const educatorId = req.auth.userId;

        console.log('🕐 Managing slot:', { educatorId, date, timeSlot, isBlocked });

        if (isBlocked) {
            // Block the slot
            const existingSlot = await TimeSlot.findOne({
                educatorId,
                date: new Date(date),
                timeSlot
            });

            if (existingSlot && existingSlot.bookingId) {
                return res.json({ 
                    success: false, 
                    message: 'Cannot block slot - already has a booking' 
                });
            }

            await TimeSlot.findOneAndUpdate(
                { educatorId, date: new Date(date), timeSlot },
                { 
                    isBlocked: true, 
                    blockReason: blockReason || 'Blocked by educator'
                },
                { upsert: true }
            );

            console.log('🚫 Slot blocked:', { date, timeSlot });

        } else {
            // Unblock the slot
            await TimeSlot.deleteOne({
                educatorId,
                date: new Date(date),
                timeSlot,
                isBlocked: true
            });

            console.log('✅ Slot unblocked:', { date, timeSlot });
        }

        res.json({ 
            success: true, 
            message: `Slot ${isBlocked ? 'blocked' : 'unblocked'} successfully` 
        });

    } catch (error) {
        console.error('❌ Manage time slot error:', error);
        res.json({ success: false, message: 'Error managing time slot' });
    }
};

// Get educator's schedule
export const getEducatorSchedule = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        const { startDate, endDate } = req.query;

        console.log('📅 Fetching schedule for educator:', educatorId);

        const query = { educatorId };
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const slots = await TimeSlot.find(query)
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'studentId',
                    select: 'name email'
                }
            })
            .sort({ date: 1, timeSlot: 1 });

        console.log('📊 Schedule slots found:', slots.length);

        res.json({ 
            success: true, 
            schedule: slots 
        });

    } catch (error) {
        console.error('❌ Get educator schedule error:', error);
        res.json({ success: false, message: 'Error fetching schedule' });
    }
};

// Process booking request (accept/decline)
export const processBookingRequest = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { action, notes } = req.body;
        const educatorId = req.auth.userId;

        const booking = await Booking.findOne({
            _id: bookingId,
            educatorId
        });

        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' });
        }

        if (action === 'accept') {
            booking.status = 'accepted';
            booking.paymentDetails.paymentStatus = 'verified';
        } else if (action === 'decline') {
            booking.status = 'declined';
            booking.notes = notes || 'Booking declined by educator';
            
            await TimeSlot.deleteOne({
                educatorId,
                date: booking.selectedDate,
                timeSlot: booking.selectedTime,
                bookingId: booking._id
            });
        }

        await booking.save();

        res.json({ 
            success: true, 
            message: `Booking ${action}ed successfully` 
        });

    } catch (error) {
        console.error('❌ Process booking error:', error);
        res.json({ success: false, message: 'Error processing booking request' });
    }
};

// Available time slots
const ALL_TIME_SLOTS = [
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM'
];

// Get available slots for a specific date
// export const getAvailableSlots = async (req, res) => {
//   try {
//     const { date } = req.params;
    
//     console.log('🔍 Backend - Fetching slots for date:', date);
    
//     // Validate date format
//     const requestDate = new Date(date);
//     if (isNaN(requestDate.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid date format'
//       });
//     }
    
//     // Set date range for the entire day
//     const startOfDay = new Date(requestDate);
//     startOfDay.setHours(0, 0, 0, 0);
    
//     const endOfDay = new Date(requestDate);
//     endOfDay.setHours(23, 59, 59, 999);
    
//     console.log('📅 Date range:', { startOfDay, endOfDay });
    
//     // Find all bookings for this date
//     const existingBookings = await Booking.find({
//       appointmentDate: {
//         $gte: startOfDay,
//         $lte: endOfDay
//       },
//       status: { $in: ['pending', 'confirmed'] } // Don't block cancelled slots
//     });
    
//     console.log('📊 Existing bookings found:', existingBookings.length);
    
//     // Get booked time slots
//     const bookedSlots = existingBookings.map(booking => booking.appointmentTime);
//     console.log('⏰ Booked slots:', bookedSlots);
    
//     // Calculate available slots
//     const availableSlots = ALL_TIME_SLOTS.filter(slot => !bookedSlots.includes(slot));
//     console.log('✅ Available slots:', availableSlots);
    
//     res.json({
//       success: true,
//       date: date,
//       availableSlots,
//       bookedSlots,
//       totalSlots: ALL_TIME_SLOTS.length,
//       message: `Found ${availableSlots.length} available slots for ${date}`
//     });
    
//   } catch (error) {
//     console.error('❌ Error in getAvailableSlots:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching available slots',
//       error: error.message
//     });
//   }
// };


// Replace your existing getAvailableSlots function with this:

export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.params;
    
    console.log('🔍 Backend - Fetching slots for date:', date);
    
    // Validate date format
    const requestDate = new Date(date);
    if (isNaN(requestDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    // Set date range for the entire day
    const startOfDay = new Date(requestDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(requestDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log('📅 Date range:', { startOfDay, endOfDay });
    
    // ✅ CHECK BOTH MODELS - This is the key change!
    
    // 1. Find bookings from Booking model (website bookings)
    const existingBookings = await Booking.find({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    // 2. Find blocked slots from TimeSlot model (LMS blocked slots)
    const blockedTimeSlots = await TimeSlot.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      isBlocked: true
    });
    
    console.log('📊 Existing bookings found:', existingBookings.length);
    console.log('🚫 Blocked time slots found:', blockedTimeSlots.length);
    
    // 3. Combine both types of occupied slots
    const bookedSlots = existingBookings.map(booking => booking.appointmentTime);
    const blockedSlots = blockedTimeSlots.map(slot => slot.timeSlot);
    const allOccupiedSlots = [...bookedSlots, ...blockedSlots];
    
    console.log('⏰ Booked slots (from Booking):', bookedSlots);
    console.log('🚫 Blocked slots (from TimeSlot):', blockedSlots);
    console.log('🔒 All occupied slots:', allOccupiedSlots);
    
    // 4. Calculate available slots
    const availableSlots = ALL_TIME_SLOTS.filter(slot => !allOccupiedSlots.includes(slot));
    console.log('✅ Available slots:', availableSlots);
    
    res.json({
      success: true,
      date: date,
      availableSlots,
      bookedSlots: allOccupiedSlots, // Return all occupied slots
      totalSlots: ALL_TIME_SLOTS.length,
      message: `Found ${availableSlots.length} available slots for ${date}`,
      // Extra debug info
      breakdown: {
        realBookings: bookedSlots.length,
        blockedSlots: blockedSlots.length,
        totalOccupied: allOccupiedSlots.length,
        available: availableSlots.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error in getAvailableSlots:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available slots',
      error: error.message
    });
  }
};
// Create a new booking with QR payment
export const createBooking = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    console.log('📝 Creating booking for user:', userId);
    console.log('📋 Request body:', req.body);
    console.log('📎 File attached:', !!req.file);
    
    const {
      serviceId,
      serviceTitle,
      servicePrice,
      serviceDuration,
      appointmentDate,
      appointmentTime,
      userPhone
    } = req.body;
    
    // Validate required fields
    if (!serviceId || !serviceTitle || !servicePrice || !serviceDuration || 
        !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'All booking details are required'
      });
    }
    
    // Validate payment screenshot
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if slot is still available
    const bookingDate = new Date(appointmentDate);
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingBooking = await Booking.findOne({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      appointmentTime,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is no longer available'
      });
    }
    
    // Upload screenshot to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'astrology_payments',
        resource_type: 'image'
      });
      
      console.log('☁️ Cloudinary upload successful:', cloudinaryResult.public_id);
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload payment screenshot'
      });
    }
    
    // Create booking
    const newBooking = new Booking({
      userId,
      serviceId: parseInt(serviceId),
      serviceTitle,
      servicePrice: parseInt(servicePrice),
      serviceDuration,
      appointmentDate: bookingDate,
      appointmentTime,
      userEmail: user.email,
      userName: user.name,
      userPhone: userPhone || '',
      paymentScreenshot: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    await newBooking.save();
    
    console.log('✅ Booking created successfully:', newBooking._id);
    
    res.status(201).json({
      success: true,
      message: 'Booking submitted successfully! Please wait for admin confirmation.',
      booking: {
        id: newBooking._id,
        serviceTitle: newBooking.serviceTitle,
        appointmentDate: newBooking.appointmentDate,
        appointmentTime: newBooking.appointmentTime,
        status: newBooking.status
      }
    });
    
  } catch (error) {
    console.error('❌ Error in createBooking:', error);
    
    // Handle specific errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: error.message
    });
  }
};

// Get user's bookings
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .select('-cloudinaryPublicId'); // Don't expose internal cloudinary IDs
    
    res.json({
      success: true,
      bookings,
      totalBookings: bookings.length
    });
    
  } catch (error) {
    console.error('❌ Error in getUserBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
      error: error.message
    });
  }
};

// Get all bookings (Admin only)
export const getAllBookings = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;
    
    // Build filter
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (date) {
      const requestDate = new Date(date);
      const startOfDay = new Date(requestDate);
      startOfDay.setHours(0, 0, 0, 0); //utc
      
      const endOfDay = new Date(requestDate);
      endOfDay.setHours(23, 59, 59, 999); //utc
      
      filter.appointmentDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email imageUrl'); // Populate user details
    
    const totalBookings = await Booking.countDocuments(filter);
    
    res.json({
      success: true,
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBookings / parseInt(limit)),
        totalBookings,
        hasNext: skip + bookings.length < totalBookings,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Error in getAllBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
      error: error.message
    });
  }
};

// Update booking status (Admin only)
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, adminNotes, paymentStatus } = req.body;
    
    console.log('🔄 Updating booking:', bookingId, 'to status:', status);
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Update fields
    if (status) booking.status = status;
    if (adminNotes !== undefined) booking.adminNotes = adminNotes;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    
    await booking.save();
    
    console.log('✅ Booking updated successfully');
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking
    });
    
  } catch (error) {
    console.error('❌ Error in updateBookingStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking',
      error: error.message
    });
  }
};

// Delete/Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.auth.userId;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check ownership
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only cancel your own bookings'
      });
    }
    
    // Only allow cancellation of pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be cancelled'
      });
    }
    
    // Update status to cancelled instead of deleting
    booking.status = 'cancelled';
    await booking.save();
    
    console.log('🚫 Booking cancelled:', bookingId);
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in cancelBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking',
      error: error.message
    });
  }
};