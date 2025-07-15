import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '@clerk/clerk-react';
import Loading from '../../components/student/Loading';

const QRPaymentPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // State variables
    const [courseData, setCourseData] = useState(null);
    const [screenshot, setScreenshot] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Context and auth
    const { backendUrl, currency, userData } = useContext(AppContext);
    const { getToken } = useAuth();

    // Fetch course data
    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    // Redirect if user not logged in
    useEffect(() => {
        if (!userData) {
            toast.error('Please login to enroll in courses');
            navigate('/');
        }
    }, [userData, navigate]);

    const fetchCourseData = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/course/${courseId}`);
            if (data.success) {
                setCourseData(data.courseData);
            } else {
                toast.error(data.message);
                navigate('/');
            }
        } catch (error) {
            toast.error('Error fetching course details');
            navigate('/');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size should be less than 5MB');
                return;
            }

            setScreenshot(file);

            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('Form submission started');
        console.log('Screenshot file:', screenshot);
        console.log('Transaction ID:', transactionId);
        console.log('Course ID:', courseId);

        if (!screenshot) {
            console.log('Error: No screenshot selected');
            toast.error('Please upload payment screenshot');
            return;
        }

        if (!transactionId.trim()) {
            console.log('Error: No transaction ID');
            toast.error('Please enter transaction ID');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('courseId', courseId);
            formData.append('transactionId', transactionId.trim());
            formData.append('screenshot', screenshot);

            // Log FormData contents
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }


            const token = await getToken();

            console.log('Token obtained:', token ? 'Yes' : 'No');

            console.log('Making API request to:', `${backendUrl}/api/user/enroll-qr`);

            const response = await axios.post(`${backendUrl}/api/user/enroll-qr`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('API Response:', response.data);

            if (response.data.success) {
                toast.success(response.data.message);

                // Clean up preview URL
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }

                // Redirect to enrollment status page
                navigate(`/enrollment-status/${courseId}`);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Upload error details:', {
                response: error.response?.data,
                status: error.response?.status,
                message: error.message
            });
            toast.error(`Error: ${error.response?.data?.message || 'Error submitting enrollment request'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!courseData) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Complete Your Enrollment</h1>
                            <p className="text-gray-600 mt-1">Follow the steps below to enroll in the course</p>
                        </div>
                        <Link
                            to={`/course/${courseId}`}
                            className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                        >
                            <span>← Back to Course</span>
                        </Link>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Side - Course Info & QR Code */}
                    <div className="space-y-6">
                        {/* Course Summary */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4">Course Summary</h2>
                            <div className="flex gap-4">
                                <img
                                    src={courseData.courseThumbnail}
                                    alt={courseData.courseTitle}
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-800">{courseData.courseTitle}</h3>
                                    <p className="text-gray-600 mt-1">By {courseData.educator.name}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-2xl font-bold text-green-600">
                                            {currency}{(courseData.price - courseData.discount * courseData.price / 100).toFixed(2)}
                                        </span>
                                        {courseData.discount > 0 && (
                                            <>
                                                <span className="text-gray-500 line-through text-sm">
                                                    {currency}{courseData.price}
                                                </span>
                                                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                                                    {courseData.discount}% OFF
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4">Step 1: Make Payment</h2>
                            <div className="text-center">
                                <div className="bg-gray-100 p-6 rounded-lg inline-block">
                                    <img
                                        src={assets.QR_Code_Example}
                                        alt="QR Code for Payment"
                                        className="w-48 h-48 mx-auto"
                                    />
                                </div>
                                <div className="mt-4">
                                    <p className="text-lg font-semibold text-gray-800">
                                        Scan & Pay {currency}{(courseData.price - courseData.discount * courseData.price / 100).toFixed(2)}
                                    </p>
                                    <p className="text-gray-600 text-sm mt-2">
                                        Use any UPI app to scan this QR code and make the payment
                                    </p>
                                    <div className="flex justify-center gap-4 mt-3">
                                        <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full">Google Pay</span>
                                        <span className="bg-purple-100 text-purple-600 text-xs px-3 py-1 rounded-full">PhonePe</span>
                                        <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full">Paytm</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-800 mb-2">Payment Instructions:</h3>
                            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                <li>Open your UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                                <li>Scan the QR code shown above</li>
                                <li>Enter the exact amount: {currency}{(courseData.price - courseData.discount * courseData.price / 100).toFixed(2)}</li>
                                <li>Complete the payment</li>
                                <li>Take a screenshot of the success page</li>
                                <li>Fill the form on the right with your payment details</li>
                            </ol>
                        </div>
                    </div>

                    {/* Right Side - Upload Form */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Step 2: Submit Payment Proof</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Screenshot Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Screenshot *
                                </label>

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="screenshot-upload"
                                        required
                                    />
                                    <label htmlFor="screenshot-upload" className="cursor-pointer">
                                        <div className="flex flex-col items-center">
                                            <img src={assets.file_upload_icon} alt="Upload" className="w-12 h-12 mb-3" />
                                            <span className="text-gray-600 font-medium">
                                                {screenshot ? 'Change Screenshot' : 'Upload Payment Screenshot'}
                                            </span>
                                            <span className="text-xs text-gray-400 mt-1">
                                                PNG, JPG, JPEG up to 5MB
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                {/* Image Preview */}
                                {previewUrl && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                                        <img
                                            src={previewUrl}
                                            alt="Payment Screenshot Preview"
                                            className="w-full max-w-xs mx-auto rounded-lg border shadow-sm"
                                        />
                                        <p className="text-xs text-green-600 text-center mt-1">✓ Screenshot uploaded successfully</p>
                                    </div>
                                )}
                            </div>

                            {/* Transaction ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Transaction ID *
                                </label>
                                <input
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    placeholder="Enter 12-digit transaction ID (e.g. 123456789012)"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    You can find this in your payment app after successful payment
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !screenshot || !transactionId.trim()}
                                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting Request...
                                    </>
                                ) : (
                                    'Submit Enrollment Request'
                                )}
                            </button>

                            {/* Help Text */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">
                                    <strong>Note:</strong> After submitting, your enrollment request will be reviewed by our admin team.
                                    You'll receive email notification once approved. This usually takes 2-4 hours during business hours.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                        <span className="text-yellow-600 text-xl">🔒</span>
                        <div>
                            <h3 className="font-semibold text-yellow-800">Security & Privacy</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                Your payment information is secure. We only use the screenshot and transaction ID to verify your payment.
                                We never store or share your financial details.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRPaymentPage;