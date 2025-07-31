import Booking from '../models/Booking.js';
import TimeSlot from '../models/TimeSlot.js';
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';

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

// Get available slots for a specific date


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


// for reflecting slot bookings and website bookings to educator dashboard

export const createWebsiteBooking = async (req, res) => {
    try {
        console.log('📝 Creating website booking...');
        console.log('Request body:', req.body);
        console.log('File received:', req.file ? 'Yes' : 'No');

        const {
            serviceId,
            serviceTitle,
            servicePrice,
            serviceDuration,
            selectedDate,
            selectedTime,
            transactionId,
            whatsappNumber,
            timestamp,
            // New user detail fields
            fullName,
            dateOfBirth,
            placeOfBirth,
            timeOfBirth
        } = req.body;

        // Validate required fields (including new ones)
        if (!serviceId || !serviceTitle || !servicePrice || !serviceDuration || 
            !selectedDate || !selectedTime || !transactionId || !whatsappNumber ||
            !fullName || !dateOfBirth || !placeOfBirth || !timeOfBirth) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required including personal details'
            });
        }

        // Validate payment screenshot
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Payment screenshot is required'
            });
        }

        // Validate WhatsApp number (10 digits)
        if (!/^\d{10}$/.test(whatsappNumber)) {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp number must be exactly 10 digits'
            });
        }

        // Validate transaction ID (alphanumeric, min 8 chars)
        if (!/^[a-zA-Z0-9]{8,}$/.test(transactionId)) {
            return res.status(400).json({
                success: false,
                message: 'Transaction ID must be at least 8 alphanumeric characters'
            });
        }

        // Validate name (min 2 chars)
        if (fullName.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Full name must be at least 2 characters long'
            });
        }

        // Check if slot is still available
        const bookingDate = new Date(selectedDate);
        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Check existing bookings
        const existingBooking = await Booking.findOne({
            selectedDate: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            selectedTime,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is no longer available'
            });
        }

        // Check blocked slots
        const blockedSlot = await TimeSlot.findOne({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            timeSlot: selectedTime,
            isBlocked: true
        });

        if (blockedSlot) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is currently blocked'
            });
        }

        // Upload screenshot to Cloudinary
        let cloudinaryResult;
        try {
            cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'astrology_website_bookings',
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

        // Create booking with enhanced user details
        const newBooking = new Booking({
            studentId: null, // Website bookings don't have student ID
            educatorId: 'single-educator', // Static value since only one educator
            serviceType: serviceTitle,
            selectedDate: bookingDate,
            selectedTime,
            duration: serviceDuration,
            amount: parseInt(servicePrice),
            status: 'pending',
            paymentDetails: {
                transactionId: transactionId.trim(),
                screenshotUrl: cloudinaryResult.secure_url,
                paymentStatus: 'pending'
            },
            contactDetails: {
                whatsappNumber,
                email: null,
                addedToWhatsAppGroup: false
            },
            // Enhanced user details for astrology consultation
            userDetails: {
                fullName: fullName.trim(),
                dateOfBirth: new Date(dateOfBirth),
                placeOfBirth: placeOfBirth.trim(),
                timeOfBirth: timeOfBirth // Stored as string in HH:MM format
            },
            notes: `Website booking - Service: ${serviceTitle}`,
            createdAt: timestamp ? new Date(parseInt(timestamp)) : new Date(),
            isWebsiteBooking: true,
            websiteBookingData: {
                serviceId: parseInt(serviceId),
                submittedAt: new Date()
            }
        });

        await newBooking.save();

        console.log('✅ Website booking created successfully:', newBooking._id);

        res.status(201).json({
            success: true,
            message: 'Booking submitted successfully! We will contact you soon for confirmation.',
            bookingId: newBooking._id,
            data: {
                serviceTitle,
                selectedDate,
                selectedTime,
                amount: servicePrice,
                customerName: fullName.trim(),
                whatsappNumber
            }
        });

    } catch (error) {
        console.error('❌ Create website booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating booking',
            error: error.message
        });
    }
};


// export const getBookingDetails = async (req, res) => {
//     try {
//         const { bookingId } = req.params;

//         const booking = await Booking.findOne({
//             _id: bookingId
//         }).populate('studentId', 'name email imageUrl createdAt');

//         if (!booking) {
//             return res.status(404).json({ 
//                 success: false, 
//                 message: 'Booking not found' 
//             });
//         }

//         // Format booking details for frontend with enhanced user info
//         const bookingDetails = {
//             ...booking.toObject(),
//             customerInfo: {
//                 name: booking.userDetails?.fullName || (booking.studentId ? booking.studentId.name : 'Website Customer'),
//                 email: booking.studentId ? booking.studentId.email : booking.contactDetails?.email || 'N/A',
//                 whatsappNumber: booking.contactDetails?.whatsappNumber || 'N/A',
//                 // New astrology-specific details
//                 dateOfBirth: booking.userDetails?.dateOfBirth || null,
//                 placeOfBirth: booking.userDetails?.placeOfBirth || 'N/A',
//                 timeOfBirth: booking.userDetails?.timeOfBirth || 'N/A',
//                 joinedDate: booking.studentId ? booking.studentId.createdAt : booking.createdAt
//             },
//             sessionInfo: {
//                 service: booking.serviceType,
//                 date: booking.selectedDate,
//                 time: booking.selectedTime,
//                 duration: booking.duration,
//                 amount: booking.amount
//             },
//             paymentInfo: {
//                 transactionId: booking.paymentDetails?.transactionId,
//                 screenshotUrl: booking.paymentDetails?.screenshotUrl,
//                 paymentStatus: booking.paymentDetails?.paymentStatus
//             },
//             bookingSource: booking.isWebsiteBooking ? 'Website' : 'LMS Platform'
//         };

//         res.json({ 
//             success: true, 
//             booking: bookingDetails 
//         });

//     } catch (error) {
//         console.error('Get booking details error:', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Error fetching booking details' 
//         });
//     }
// };

export const getBookingDetails = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findOne({
            _id: bookingId
        }).populate('studentId', 'name email imageUrl createdAt');

        if (!booking) {
            return res.status(404).json({ 
                success: false, 
                message: 'Booking not found' 
            });
        }

        // Format booking details for frontend - SIMPLIFIED (removed email, source, status)
        const bookingDetails = {
            ...booking.toObject(),
            customerInfo: {
                name: booking.userDetails?.fullName || (booking.studentId ? booking.studentId.name : 'Website Customer'),
                whatsappNumber: booking.contactDetails?.whatsappNumber || 'N/A',
                // Astrology-specific details
                dateOfBirth: booking.userDetails?.dateOfBirth || null,
                placeOfBirth: booking.userDetails?.placeOfBirth || 'N/A',
                timeOfBirth: booking.userDetails?.timeOfBirth || 'N/A',
                joinedDate: booking.studentId ? booking.studentId.createdAt : booking.createdAt
            },
            sessionInfo: {
                service: booking.serviceType,
                date: booking.selectedDate,
                time: booking.selectedTime,
                duration: booking.duration,
                amount: booking.amount
            },
            paymentInfo: {
                transactionId: booking.paymentDetails?.transactionId,
                screenshotUrl: booking.paymentDetails?.screenshotUrl
                // Removed paymentStatus from response
            },
            // Include read status for checkbox
            isRead: booking.isRead || false
            // Removed bookingSource from response
        };

        res.json({ 
            success: true, 
            booking: bookingDetails 
        });

    } catch (error) {
        console.error('Get booking details error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching booking details' 
        });
    }
};


// export const markBookingAsRead = async (req, res) => {
//     try {
//         const { bookingId } = req.params;

//         // Find the current booking to check its current read status
//         const currentBooking = await Booking.findOne({ _id: bookingId });
        
//         if (!currentBooking) {
//             return res.status(404).json({ 
//                 success: false, 
//                 message: 'Booking not found' 
//             });
//         }

//         // Toggle the read status (if currently read, make unread; if unread, make read)
//         const newReadStatus = !currentBooking.isRead;

//         const booking = await Booking.findOneAndUpdate(
//             { _id: bookingId },
//             { 
//                 isRead: newReadStatus,
//                 readAt: newReadStatus ? new Date() : null // Set readAt only when marking as read
//             },
//             { new: true }
//         );

//         res.json({ 
//             success: true, 
//             message: `Booking marked as ${newReadStatus ? 'read' : 'unread'}`,
//             isRead: newReadStatus
//         });

//     } catch (error) {
//         console.error('Mark booking as read error:', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Error updating read status' 
//         });
//     }
// };

export const getPendingBookings = async (req, res) => {
    try {
        console.log('📋 Fetching ALL pending bookings (single educator system)');

        // REMOVED educatorId filter - get ALL pending bookings
        const pendingBookings = await Booking.find({
            status: 'pending'
        })
        .populate('studentId', 'name email imageUrl createdAt')
        .sort({ createdAt: -1 }); // Sort by newest first (epoch timestamp)

        console.log('📊 Found pending bookings:', pendingBookings.length);

        // Add read status tracking and customer info
        const bookingsWithReadStatus = pendingBookings.map(booking => ({
            ...booking.toObject(),
            isRead: booking.isRead || false,
            isWebsiteBooking: booking.isWebsiteBooking || false,
            customerName: booking.studentId ? booking.studentId.name : 'Website Customer',
            customerEmail: booking.studentId ? booking.studentId.email : booking.contactDetails?.email || 'N/A',
            customerContact: booking.contactDetails?.whatsappNumber || 'N/A'
        }));

        res.json({ 
            success: true, 
            bookings: bookingsWithReadStatus 
        });

    } catch (error) {
        console.error('Get pending bookings error:', error);
        res.json({ success: false, message: 'Error fetching pending bookings' });
    }
};

export const markBookingAsRead = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // REMOVED educatorId filter since single educator
        const booking = await Booking.findOneAndUpdate(
            { _id: bookingId },
            { 
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ 
                success: false, 
                message: 'Booking not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Booking marked as read' 
        });

    } catch (error) {
        console.error('Mark booking as read error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error marking booking as read' 
        });
    }
};



export const manageTimeSlot = async (req, res) => {
    try {
        const { date, timeSlot, isBlocked, blockReason } = req.body;

        console.log('🕐 Managing slot:', { date, timeSlot, isBlocked });

        if (isBlocked) {
            // Block the slot - check for existing bookings first
            const existingBooking = await Booking.findOne({
                selectedDate: new Date(date),
                selectedTime: timeSlot,
                status: { $in: ['pending', 'accepted'] }
            });

            if (existingBooking) {
                return res.json({ 
                    success: false, 
                    message: 'Cannot block slot - already has a booking' 
                });
            }

            // Create or update blocked slot (removed educatorId)
            await TimeSlot.findOneAndUpdate(
                { date: new Date(date), timeSlot },
                { 
                    isBlocked: true, 
                    blockReason: blockReason || 'Blocked by educator',
                    educatorId: 'single-educator' // Static value
                },
                { upsert: true }
            );

            console.log('🚫 Slot blocked:', { date, timeSlot });

        } else {
            // Unblock the slot (removed educatorId filter)
            await TimeSlot.deleteOne({
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

export const getEducatorSchedule = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        console.log('📅 Fetching schedule for single educator system');

        const query = {};
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // REMOVED educatorId filter - get ALL time slots
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

export const deleteBookings = async (req, res) => {
    try {
        const result = await Booking.deleteMany({ isWebsiteBooking: true });
        res.json({ 
            success: true, 
            message: `Deleted ${result.deletedCount} website bookings`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}