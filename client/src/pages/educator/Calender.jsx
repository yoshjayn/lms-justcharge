import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { 
    MessageCircle, 
    Phone, 
    Calendar as CalendarIcon, 
    X, 
    CheckCircle, 
    XCircle, 
    Eye,
    User,
    Clock,
    CreditCard,
    MapPin
} from 'lucide-react';

const Calender = () => {
    const { backendUrl, getToken, isEducator } = useContext(AppContext);

    // State management
    const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'bookings'
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Block/Manage Slots Tab State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [blockedSlots, setBlockedSlots] = useState([]);
    
    // New Bookings Tab State
    const [pendingBookings, setPendingBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);

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
                console.log('📋 Pending bookings:', response.data.bookings);
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

    // Handle booking tile click
    const handleBookingClick = async (booking) => {
        setLoadingBookingDetails(true);
        setShowBookingModal(true);
        
        try {
            const token = await getToken();

            // Fetch detailed booking information
            const response = await axios.get(`${backendUrl}/api/booking/details/${booking._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSelectedBooking(response.data.booking);
            }
        } catch (error) {
            console.error('Error fetching booking details:', error);
            toast.error('Error loading booking details');
        } finally {
            setLoadingBookingDetails(false);
        }
    };

    // Handle time slot blocking/unblocking
    const handleTimeSlotClick = (timeSlot) => {
        const slotInfo = getSlotInfo(timeSlot);
        const isBlocked = isSlotBlocked(timeSlot);

        if (slotInfo && slotInfo.bookingId) {
            toast.info('This slot has a booking and cannot be modified');
            return;
        }

        if (isBlocked) {
            handleUnblockSlot(slotInfo);
        } else {
            setSelectedTime(timeSlot);
        }
    };

    const handleBlockSlot = async () => {
        if (!selectedTime) {
            toast.error('Please select a time slot first');
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
                setSelectedTime('');
                fetchBlockedSlots();
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

    // Disable past dates
    const isDateDisabled = ({ date }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
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
                            setSelectedTime('');
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
                        className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
                            activeTab === 'bookings'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        New Bookings
                        {pendingBookings.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {pendingBookings.length}
                            </span>
                        )}
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
                                            setSelectedTime('');
                                        }}
                                        value={selectedDate}
                                        className="calendar-custom w-full"
                                        tileClassName={({ date }) =>
                                            date.toDateString() === selectedDate.toDateString()
                                                ? "bg-[#A16D00] text-white rounded-full"
                                                : ""
                                        }
                                        tileDisabled={isDateDisabled}
                                        nextLabel=">"
                                        prevLabel="<"
                                    />
                                </div>
                            </div>

                            {/* Time Slots Management */}
                            <div className="border rounded-md p-3 sm:p-5 flex flex-col bg-white shadow-sm"
                                style={{ width: "100%", maxWidth: "434px", height: "380px", margin: "0 auto" }}>
                                <h2 className="text-lg font-semibold mb-4">Select A Time</h2>
                                
                                <div className="flex flex-col gap-3 overflow-y-auto mb-4">
                                    {timeSlots.map((timeSlot) => {
                                        const slotInfo = getSlotInfo(timeSlot);
                                        const isBlocked = isSlotBlocked(timeSlot);
                                        const hasBooking = slotInfo && slotInfo.bookingId;
                                        
                                        return (
                                            <button
                                                key={timeSlot}
                                                onClick={() => handleTimeSlotClick(timeSlot)}
                                                className={`border rounded py-3 text-center transition relative ${
                                                    selectedTime === timeSlot
                                                        ? "bg-[#A16D00] text-white border-[#A16D00]"
                                                        : hasBooking
                                                            ? "bg-red-100 text-red-600 border-red-200 cursor-not-allowed"
                                                            : isBlocked
                                                                ? "bg-yellow-100 text-yellow-600 border-yellow-200 hover:bg-yellow-200"
                                                                : "bg-white text-[#5E4326] hover:bg-gray-50 border-gray-300"
                                                }`}
                                            >
                                                <span className="block font-medium">{timeSlot}</span>
                                                {hasBooking && (
                                                    <span className="text-xs text-red-500 block mt-1">Booked</span>
                                                )}
                                                {isBlocked && !hasBooking && (
                                                    <span className="text-xs text-yellow-600 block mt-1">Blocked</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Block Button */}
                                <button
                                    onClick={handleBlockSlot}
                                    disabled={!selectedTime || processing}
                                    className="w-full bg-[#5E4326] text-white py-3 px-4 rounded hover:bg-[#4a3723] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
                            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No New Bookings</h3>
                                <p className="text-gray-500">New booking requests will appear here for your review.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {pendingBookings.map((booking) => (
                                    <div
                                        key={booking._id}
                                        onClick={() => handleBookingClick(booking)}
                                        className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow ${
                                            !booking.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-500" />
                                                        <span className="font-medium text-gray-900">
                                                            {booking.customerName}
                                                        </span>
                                                    </div>
                                                    {!booking.isRead && (
                                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                            New
                                                        </span>
                                                    )}
                                                    {booking.isWebsiteBooking && (
                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                            Website
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-4 w-4" />
                                                        <span>{new Date(booking.selectedDate).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{booking.selectedTime}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-4 w-4" />
                                                        <span>₹{booking.amount}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {booking.serviceType}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Booking Details Modal */}
                {showBookingModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
                                <button
                                    onClick={() => {
                                        setShowBookingModal(false);
                                        setSelectedBooking(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                {loadingBookingDetails ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : selectedBooking ? (
                                    <div className="space-y-6">
                                        {/* Customer Information */}
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-500" />
                                                        <span className="font-medium">Name:</span>
                                                        <span>{selectedBooking.customerInfo.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MessageCircle className="h-4 w-4 text-gray-500" />
                                                        <span className="font-medium">WhatsApp:</span>
                                                        <span>{selectedBooking.customerInfo.whatsappNumber}</span>
                                                    </div>
                                                </div>

                                                {/* Astrology Details Section */}
                                                {selectedBooking.customerInfo.dateOfBirth && (
                                                    <div className="border-t pt-3 mt-3">
                                                        <h4 className="font-medium text-gray-900 mb-2">Astrology Details</h4>
                                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Date of Birth:</span>
                                                                <span>{new Date(selectedBooking.customerInfo.dateOfBirth).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Time of Birth:</span>
                                                                <span>{selectedBooking.customerInfo.timeOfBirth}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Place of Birth:</span>
                                                                <span>{selectedBooking.customerInfo.placeOfBirth}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Session Information */}
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-3">Session Details</h3>
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                                <div><span className="font-medium">Service:</span> {selectedBooking.sessionInfo.service}</div>
                                                <div><span className="font-medium">Date:</span> {new Date(selectedBooking.sessionInfo.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}</div>
                                                <div><span className="font-medium">Time:</span> {selectedBooking.sessionInfo.time}</div>
                                                <div><span className="font-medium">Duration:</span> {selectedBooking.sessionInfo.duration}</div>
                                                <div><span className="font-medium">Amount:</span> ₹{selectedBooking.sessionInfo.amount}</div>
                                            </div>
                                        </div>

                                        {/* Payment Information */}
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Details</h3>
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                <div><span className="font-medium">Transaction ID:</span> {selectedBooking.paymentInfo.transactionId}</div>
                                                {selectedBooking.paymentInfo.screenshotUrl && (
                                                    <div>
                                                        <span className="font-medium block mb-2">Payment Screenshot:</span>
                                                        <img
                                                            src={selectedBooking.paymentInfo.screenshotUrl}
                                                            alt="Payment Screenshot"
                                                            className="w-full max-w-md mx-auto rounded-lg border shadow-sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mark as Read Checkbox */}
                                        {/* <div className="flex items-center justify-center pt-4 border-t">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBooking.isRead || false}
                                                    onChange={async (e) => {
                                                        const isChecked = e.target.checked;
                                                        try {
                                                            const token = await getToken();
                                                            await axios.patch(`${backendUrl}/api/booking/mark-read/${selectedBooking._id}`, {}, {
                                                                headers: { Authorization: `Bearer ${token}` }
                                                            });
                                                            
                                                            setSelectedBooking(prev => ({
                                                                ...prev,
                                                                isRead: isChecked
                                                            }));
                                                            
                                                            setPendingBookings(prev => 
                                                                prev.map(b => b._id === selectedBooking._id ? {...b, isRead: isChecked} : b)
                                                            );
                                                            
                                                            toast.success(isChecked ? 'Marked as read' : 'Marked as unread');
                                                        } catch (error) {
                                                            console.error('Error updating read status:', error);
                                                            toast.error('Error updating read status');
                                                            e.target.checked = !isChecked;
                                                        }
                                                    }}
                                                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="text-lg font-medium text-gray-900">
                                                    Mark as read
                                                </span>
                                            </label>
                                        </div> */}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">Failed to load booking details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calender;