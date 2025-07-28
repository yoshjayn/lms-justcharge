import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { MessageCircle, Phone, Calendar as CalendarIcon, X, CheckCircle, XCircle } from 'lucide-react';

const Calender = () => {
    const { backendUrl, getToken, isEducator } = useContext(AppContext);

    // State management
    const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'bookings'
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Block/Manage Slots Tab State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(''); // Store selected time slot
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [pendingBookings, setPendingBookings] = useState([]);

    // Time slots array
    const timeSlots = [
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
        '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
        '06:00 PM', '06:30 PM', '07:00 PM'
    ];

    useEffect(() => {
        if (isEducator) {
            fetchData();
        }
    }, [isEducator]);

    useEffect(() => {
        if (selectedDate && activeTab === 'manage') {
            fetchBlockedSlots();
        }
    }, [selectedDate, activeTab]);

    useEffect(() => {
        if (activeTab === 'bookings') {
            fetchPendingBookings();
        }
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchBlockedSlots(),
                fetchPendingBookings()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingBookings = async () => {
        try {
            const token = await getToken();
            const response = await axios.get(`${backendUrl}/api/booking/pending-bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setPendingBookings(response.data.bookings);
            }
        } catch (error) {
            console.error('Error fetching pending bookings:', error);
            setPendingBookings([]);
        }
    };

    const fetchBlockedSlots = async () => {
        try {
            const token = await getToken();
            const dateString = selectedDate.toISOString().split('T')[0];
            const response = await axios.get(`${backendUrl}/api/booking/educator-schedule`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { startDate: dateString, endDate: dateString }
            });

            if (response.data.success) {
                setBlockedSlots(response.data.schedule);
            }
        } catch (error) {
            console.error('Error fetching blocked slots:', error);
            setBlockedSlots([]);
        }
    };

    // Handle time slot selection
    const handleTimeSlotClick = (timeSlot) => {
        const slotInfo = getSlotInfo(timeSlot);
        const isBlocked = isSlotBlocked(timeSlot);

        if (isBlocked && slotInfo?.isBlocked) {
            // If slot is blocked, unblock it
            handleUnblockSlot(slotInfo);
        } else if (!isBlocked) {
            // If slot is available, select it for blocking
            setSelectedTime(timeSlot);
            console.log('📋 Selected time slot for blocking:', timeSlot);
        }
        // If slot has a booking, do nothing (disabled)
    };

    // Handle "Block Slot" button click
    const handleBookSlot = async () => {
        if (!selectedTime) {
            toast.error('Please select a time slot to block');
            return;
        }

        setProcessing(true);
        try {
            const token = await getToken();
            const response = await axios.post(`${backendUrl}/api/booking/manage-slot`, {
                date: selectedDate.toISOString().split('T')[0],
                timeSlot: selectedTime,
                isBlocked: true,
                blockReason: 'Blocked by educator'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success(`Time slot ${selectedTime} blocked successfully`);
                setSelectedTime(''); // Clear selection
                fetchBlockedSlots(); // Refresh blocked slots
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error blocking slot:', error);
            toast.error('Error blocking time slot');
        } finally {
            setProcessing(false);
        }
    };

    const handleUnblockSlot = async (slot) => {
        setProcessing(true);
        try {
            const token = await getToken();
            const response = await axios.post(`${backendUrl}/api/booking/manage-slot`, {
                date: slot.date,
                timeSlot: slot.timeSlot,
                isBlocked: false
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success(`Time slot ${slot.timeSlot} unblocked successfully`);
                fetchBlockedSlots();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error unblocking slot:', error);
            toast.error('Error unblocking time slot');
        } finally {
            setProcessing(false);
        }
    };

    const isSlotBlocked = (timeSlot) => {
        return blockedSlots.some(slot => slot.timeSlot === timeSlot && (slot.isBlocked || slot.bookingId));
    };

    const getSlotInfo = (timeSlot) => {
        return blockedSlots.find(slot => slot.timeSlot === timeSlot);
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Calendar Management</h1>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
                    <button
                        onClick={() => {
                            setActiveTab('manage');
                            setSelectedTime(''); // Clear selection when switching tabs
                        }}
                        className={`px-6 py-2 rounded-md font-medium transition-colors ${
                            activeTab === 'manage'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Block/Manage Slots
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`px-6 py-2 rounded-md font-medium transition-colors ${
                            activeTab === 'bookings'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        New Bookings ({pendingBookings.length})
                    </button>
                </div>

                {/* Block/Manage Slots Tab */}
                {activeTab === 'manage' && (
                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row gap-6 mb-8 w-full" style={{ maxWidth: "1190px" }}>
                            {/* Calendar */}
                            <div className="border rounded-md p-3 sm:p-5 flex flex-col bg-white shadow-sm"
                                style={{ width: "100%", maxWidth: "736px", height: "380px", margin: "0 auto" }}>
                                <h2 className="text-lg font-semibold mb-4">Select A Date</h2>
                                <div className="flex-grow flex justify-center items-center">
                                    <Calendar
                                        onChange={(date) => {
                                            setSelectedDate(date);
                                            setSelectedTime(''); // Clear time selection when date changes
                                        }}
                                        value={selectedDate}
                                        className="calendar-custom w-full"
                                        tileClassName={({ date }) =>
                                            date.toDateString() === selectedDate.toDateString()
                                                ? "bg-[#A16D00] text-white rounded-full"
                                                : ""
                                        }
                                        tileDisabled={({ date }) => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            return date < today;
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Time Slots */}
                            <div className="border rounded-md p-3 sm:p-5 flex flex-col bg-white shadow-sm"
                                style={{ width: "100%", maxWidth: "434px", height: "380px", margin: "0 auto" }}>
                                <h2 className="text-lg font-semibold mb-4">
                                    Manage Time Slots
                                    {selectedTime && (
                                        <span className="text-sm text-blue-600 ml-2">
                                            (Selected: {selectedTime})
                                        </span>
                                    )}
                                </h2>
                                <div className="flex flex-col gap-3 overflow-y-auto">
                                    {timeSlots.map((time) => {
                                        const slotInfo = getSlotInfo(time);
                                        const isBlocked = isSlotBlocked(time);
                                        const isSelected = selectedTime === time;

                                        return (
                                            <div key={time} className="relative">
                                                <button
                                                    onClick={() => handleTimeSlotClick(time)}
                                                    disabled={slotInfo?.bookingId} // Disable if has booking
                                                    className={`w-full border rounded py-3 text-center transition ${
                                                        slotInfo?.bookingId
                                                            ? "bg-red-100 text-red-800 border-red-300 cursor-not-allowed"
                                                            : isSelected
                                                                ? "bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-500"
                                                                : isBlocked
                                                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                                                                    : "bg-white text-[#5E4326] hover:bg-gray-50 border-gray-300"
                                                    }`}
                                                >
                                                    <span className="block">{time}</span>
                                                    {slotInfo?.bookingId && <span className="text-xs">Booked</span>}
                                                    {slotInfo?.isBlocked && !slotInfo?.bookingId && (
                                                        <span className="text-xs">Blocked (Click to unblock)</span>
                                                    )}
                                                    {isSelected && !isBlocked && (
                                                        <span className="text-xs">Selected for blocking</span>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Block Slot Button */}
                        <div className="flex justify-center lg:justify-end w-full max-w-[1190px]">
                            <button
                                onClick={handleBookSlot}
                                disabled={!selectedTime || processing}
                                className="flex items-center gap-2 bg-[#5E4326] text-white px-8 py-3 rounded hover:bg-[#4a3723] transition w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ maxWidth: "323px", height: "53px" }}
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Blocking...
                                    </>
                                ) : (
                                    <>
                                        Block Slot
                                        {selectedTime && <span className="ml-1">({selectedTime})</span>}
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-medium text-blue-900 mb-2">How to manage slots:</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Click on an available (white) slot to select it for blocking</li>
                                <li>• Click "Block Slot" button to block the selected time slot</li>
                                <li>• Click on a blocked (yellow) slot to unblock it immediately</li>
                                <li>• Booked (red) slots cannot be modified</li>
                                <li>• Blocked slots will not be available for booking on the website</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* New Bookings Tab */}
                {activeTab === 'bookings' && (
                    <div className="space-y-6">
                        {pendingBookings.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending bookings</h3>
                                <p className="text-gray-500">New booking requests will appear here for your review.</p>
                            </div>
                        ) : (
                            pendingBookings.map((booking) => (
                                <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Booking Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-4">
                                                {/* Handle both LMS users and website users */}
                                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                    {booking.studentId?.imageUrl ? (
                                                        <img
                                                            src={booking.studentId.imageUrl}
                                                            alt="Student"
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-600 font-medium">
                                                            {booking.studentId?.name?.charAt(0) || 'W'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg text-gray-900">
                                                        {booking.studentId?.name || 'Website User'}
                                                    </h3>
                                                    <p className="text-gray-600">
                                                        {booking.studentId?.email || 'No email provided'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-500">Service</p>
                                                    <p className="font-medium">{booking.serviceType}</p>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-500">Amount</p>
                                                    <p className="font-medium text-green-600">₹{booking.amount}</p>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-500">Date</p>
                                                    <p className="font-medium">{new Date(booking.selectedDate).toLocaleDateString()}</p>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-500">Time</p>
                                                    <p className="font-medium">{booking.selectedTime}</p>
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-600">
                                                <p><strong>Transaction ID:</strong> {booking.paymentDetails.transactionId}</p>
                                                <p><strong>WhatsApp:</strong> +91 {booking.contactDetails.whatsappNumber}</p>
                                                <p><strong>Submitted:</strong> {new Date(booking.createdAt).toLocaleString()}</p>
                                                <p><strong>Source:</strong> {booking.studentId?.name ? 'LMS User' : 'Website User'}</p>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="lg:w-1/3 flex items-center justify-center">
                                            <button
                                                onClick={() => {
                                                    // Handle view details - you can implement modal here
                                                    console.log('View booking details:', booking);
                                                }}
                                                className="w-full bg-blue-600 text-white py-3.5 px-6 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calender;