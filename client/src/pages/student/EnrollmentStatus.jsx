
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const EnrollmentStatus = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchEnrollmentStatus();
  }, [courseId]);

  const fetchEnrollmentStatus = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${backendUrl}/api/user/enrollment-status/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setEnrollmentData(response.data.enrollment);
      } else {
        setEnrollmentData(null);
      }
    } catch (error) {
      console.error('Error fetching enrollment status:', error);
      setEnrollmentData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRejectedEnrollment = async () => {
    if (!enrollmentData || enrollmentData.status !== 'rejected') return;

    setRemoving(true);
    
    try {
      const token = await getToken();
      const response = await axios.delete(
        `${backendUrl}/api/user/remove-rejected-enrollment/${enrollmentData._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Rejected enrollment removed successfully');
        // Redirect back to course details
        navigate(`/course/${courseId}`);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error removing enrollment:', error);
      toast.error('Error removing enrollment');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="bg-[#F9ECE2] max-w-4xl mx-auto p-6 min-h-screen">
      <div className="mb-6">
        <Link 
          to={`/course/${courseId}`}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to Course Details
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Enrollment Status</h1>

      {enrollmentData ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className={`p-4 rounded-lg mb-6 ${
            enrollmentData.status === 'pending' ? 
            'bg-yellow-100' :
            enrollmentData.status === 'approved' ? 'bg-green-100' :
            'bg-red-100'
          }`}>
            <h3 className="font-semibold mb-2">
              Status: {enrollmentData.status.toUpperCase()}
            </h3>
            
            {enrollmentData.status === 'pending' && (
              <div>
                <p>Your enrollment request is being reviewed by our admin team. We'll notify you once it's processed.</p>
                <p className="text-sm text-gray-600 mt-2">
                  ⏳ Please be patient while we review your payment screenshot and transaction details.
                </p>
              </div>
            )}
            
            {enrollmentData.status === 'approved' && (
              <div>
                <p className="mb-3">🎉 Congratulations! Your enrollment has been approved.</p>
                <Link 
                  to={`/player/${courseId}`}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors inline-block"
                >
                  Start Learning
                </Link>
              </div>
            )}
            
            {enrollmentData.status === 'rejected' && (
              <div>
                <p className="mb-2">❌ Unfortunately, your enrollment request was rejected.</p>
                {enrollmentData.rejectionReason && (
                  <p className="text-sm mb-4">
                    <strong>Reason:</strong> {enrollmentData.rejectionReason}
                  </p>
                )}
                <div className="flex gap-3">
                  <Link 
                    to={`/qr-payment/${courseId}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Try Enrolling Again
                  </Link>
                  <button 
                    onClick={handleRemoveRejectedEnrollment}
                    disabled={removing}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {removing ? 'Removing...' : 'Remove This Request'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Transaction Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Transaction ID:</strong> {enrollmentData.transactionId}</p>
                <p><strong>Submitted:</strong> {new Date(enrollmentData.createdAt).toLocaleString()}</p>
                {enrollmentData.processedAt && (
                  <p><strong>Processed:</strong> {new Date(enrollmentData.processedAt).toLocaleString()}</p>
                )}
                {enrollmentData.processedBy && (
                  <p><strong>Processed By:</strong> Admin</p>
                )}
              </div>
            </div>

            {/* Payment Screenshot */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Payment Screenshot</h4>
              <img
                src={enrollmentData.paymentScreenshot}
                alt="Payment Screenshot"
                className="w-full max-w-sm rounded-lg border border-gray-200"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              <Link
                to={`/course/${courseId}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                View Course Details
              </Link>
              
              {enrollmentData.status === 'rejected' && (
                <Link
                  to={`/qr-payment/${courseId}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Submit New Request
                </Link>
              )}
              
              {enrollmentData.status === 'approved' && (
                <Link
                  to={`/player/${courseId}`}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Access Course
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No enrollment request found for this course.</p>
            <div className="space-y-3">
              <Link 
                to={`/course/${courseId}`}
                className="text-blue-600 hover:text-blue-800 block"
              >
                Go back to course details
              </Link>
              <Link 
                to={`/qr-payment/${courseId}`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors inline-block"
              >
                Submit Enrollment Request
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentStatus;