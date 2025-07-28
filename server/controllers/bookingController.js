// server/controllers/bookingController.js
import Booking from '../models/Booking.js';
import TimeSlot from '../models/TimeSlot.js';
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';

// ===== EDUCATOR FUNCTIONS (LMS - Auth Required) =====

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

// Block/unblock time slot
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
        console.error('Manage time slot error:', error);
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
        console.error('Get educator schedule error:', error);
        res.json({ success: false, message: 'Error fetching schedule' });
    }
};

// Accept or decline booking
export const processBookingRequest = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { action, notes } = req.body; // action: 'accept' or 'decline'
        const educatorId = req.auth.userId;

        console.log('🔄 Processing booking:', { bookingId, action, educatorId });

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
            console.log('✅ Booking accepted:', bookingId);
        } else if (action === 'decline') {
            booking.status = 'declined';
            booking.notes = notes || 'Booking declined by educator';
            
            // Remove the time slot reservation
            await TimeSlot.deleteOne({
                educatorId,
                date: booking.selectedDate,
                timeSlot: booking.selectedTime,
                bookingId: booking._id
            });
            
            console.log('❌ Booking declined and slot freed:', bookingId);
        }

        await booking.save();

        res.json({ 
            success: true, 
            message: `Booking ${action}ed successfully` 
        });

    } catch (error) {
        console.error('Process booking error:', error);
        res.json({ success: false, message: 'Error processing booking request' });
    }
};

// ===== WEBSITE BOOKING FUNCTIONS (No Auth Required) =====

// Get available slots for website (no educatorId needed)
export const getAvailableSlotsWebsite = async (req, res) => {
    try {
        const { date } = req.params;

        console.log('🔍 Website checking slots for date:', date);

        // Define all possible time slots
        const allTimeSlots = [
            '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
            '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
            '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
            '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
            '06:00 PM', '06:30 PM', '07:00 PM'
        ];

        // Get blocked or booked slots for the date
        // Since there's only one educator, we don't need educatorId filter
        const blockedSlots = await TimeSlot.find({
            date: new Date(date),
            $or: [
                { isBlocked: true },
                { bookingId: { $exists: true } }
            ]
        }).select('timeSlot');

        const blockedTimeSlots = blockedSlots.map(slot => slot.timeSlot);
        const availableSlots = allTimeSlots.filter(slot => !blockedTimeSlots.includes(slot));

        console.log('📊 Website slots summary:', {
            date,
            total: allTimeSlots.length,
            blocked: blockedTimeSlots.length,
            available: availableSlots.length,
            blockedSlots: blockedTimeSlots
        });

        res.json({ 
            success: true, 
            availableSlots,
            bookedSlots: blockedTimeSlots
        });

    } catch (error) {
        console.error('❌ Get website available slots error:', error);
        res.json({ success: false, message: 'Error fetching available slots' });
    }
};

// Create booking from website (No Auth Required)
export const createBookingWebsite = async (req, res) => {
    try {
        const { 
            serviceType, 
            selectedDate, 
            selectedTime, 
            duration, 
            amount, 
            transactionId, 
            whatsappNumber
        } = req.body;

        console.log('📋 Website booking request:', {
            serviceType,
            selectedDate,
            selectedTime,
            transactionId,
            whatsappNumber,
            hasFile: !!req.file
        });

        // Basic validation
        if (!serviceType || !selectedDate || !selectedTime || !transactionId || !whatsappNumber) {
            return res.json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Since there's only one educator, we'll use a default educator ID
        // You can replace this with the actual educator's Clerk ID from your LMS
        const defaultEducatorId = process.env.DEFAULT_EDUCATOR_ID || "default_educator_123";

        // Check if slot is still available
        const existingSlot = await TimeSlot.findOne({
            educatorId: defaultEducatorId,
            date: new Date(selectedDate),
            timeSlot: selectedTime,
            $or: [
                { isBlocked: true },
                { bookingId: { $exists: true } }
            ]
        });

        if (existingSlot) {
            return res.json({ 
                success: false, 
                message: 'This time slot is no longer available. Please select another slot.' 
            });
        }

        // Upload screenshot to cloudinary if provided
        let screenshotUrl = null;
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'website_payment_screenshots',
                    resource_type: 'image'
                });
                screenshotUrl = result.secure_url;
                console.log('📷 Website screenshot uploaded:', screenshotUrl);
            } catch (uploadError) {
                console.error('❌ Upload error:', uploadError);
                return res.json({ 
                    success: false, 
                    message: 'Error uploading payment screenshot' 
                });
            }
        }

        // Create booking record
        const booking = new Booking({
            studentId: `website_user_${Date.now()}`, // Temporary ID for website users
            educatorId: defaultEducatorId,
            serviceType,
            selectedDate: new Date(selectedDate),
            selectedTime,
            duration,
            amount: parseFloat(amount),
            paymentDetails: {
                transactionId,
                screenshotUrl,
                paymentStatus: 'pending'
            },
            contactDetails: {
                whatsappNumber,
                email: null // No email for website bookings initially
            },
            status: 'pending'
        });

        await booking.save();
        console.log('✅ Website booking created:', booking._id);

        // Create time slot entry to mark as reserved
        const timeSlot = new TimeSlot({
            educatorId: defaultEducatorId,
            date: new Date(selectedDate),
            timeSlot: selectedTime,
            bookingId: booking._id
        });

        await timeSlot.save();
        console.log('🕐 Time slot reserved for website booking:', timeSlot._id);

        res.json({ 
            success: true, 
            message: 'Booking request submitted successfully',
            bookingId: booking._id
        });

    } catch (error) {
        console.error('❌ Create website booking error:', error);
        
        // Handle duplicate key error (same slot booked simultaneously)
        if (error.code === 11000) {
            return res.json({ 
                success: false, 
                message: 'This time slot was just booked by someone else. Please select another slot.' 
            });
        }
        
        res.json({ 
            success: false, 
            message: 'Error creating booking request. Please try again.' 
        });
    }
};