// MyEnrollments.jsx - Only remove the "Remove" button, keep everything else identical

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Loading from '../../components/student/Loading';

const MyEnrollments = () => {
  const { getToken } = useAuth();
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [removingId, setRemovingId] = useState(null); // Removed - no longer needed

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchMyEnrollments();
  }, []);

  const fetchMyEnrollments = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${backendUrl}/api/user/my-pending-enrollments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setPendingEnrollments(response.data.enrollments);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Error fetching your enrollments');
    } finally {
      setLoading(false);
    }
  };

  // handleRemoveRejectedEnrollment function removed - no longer needed

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      approved: '✅',
      rejected: '❌'
    };
    return icons[status] || '📄';
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="bg-[#F9ECE2]">
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Enrollments</h1>

      {pendingEnrollments.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-600 text-lg mb-4">You haven't submitted any enrollment requests yet.</p>
            <Link 
              to="/course-list"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingEnrollments.map((enrollment) => (
            <div key={enrollment._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="relative">
                <img
                  src={enrollment.courseId.courseThumbnail}
                  alt={enrollment.courseId.courseTitle}
                  className="w-full h-48 object-cover"
                />
                <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(enrollment.status)}`}>
                  {getStatusIcon(enrollment.status)} {enrollment.status.toUpperCase()}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                  {enrollment.courseId.courseTitle}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Price:</strong> ₹{enrollment.courseId.coursePrice}</p>
                  <p><strong>Transaction ID:</strong> {enrollment.transactionId}</p>
                  <p><strong>Submitted:</strong> {new Date(enrollment.createdAt).toLocaleDateString()}</p>
                  
                  {enrollment.status === 'rejected' && enrollment.rejectionReason && (
                    <div className="mt-3 p-2 bg-red-50 rounded">
                      <p className="text-red-800 text-xs">
                        <strong>Rejection Reason:</strong> {enrollment.rejectionReason}
                      </p>
                    </div>
                  )}
                  
                  {enrollment.status === 'approved' && (
                    <div className="mt-3 p-2 bg-green-50 rounded">
                      <p className="text-green-800 text-xs">
                        <strong>Approved!</strong> You can now access the course.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                  <Link
                    to={`/enrollment-status/${enrollment.courseId._id}`}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors text-center block text-sm"
                  >
                    View Details
                  </Link>
                  
                  {enrollment.status === 'approved' && (
                    <Link
                      to={`/player/${enrollment.courseId._id}`}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors text-center block text-sm"
                    >
                      Access Course
                    </Link>
                  )}
                  
                  {enrollment.status === 'rejected' && (
                    <Link
                      to={`/qr-payment/${enrollment.courseId._id}`}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-center block text-sm"
                    >
                      Try Again
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Section - Commented out */}
      {/* {pendingEnrollments.length > 0 && (
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrollment Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingEnrollments.filter(e => e.status === 'pending').length}
              </div>
              <div className="text-sm text-yellow-700">Pending</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {pendingEnrollments.filter(e => e.status === 'approved').length}
              </div>
              <div className="text-sm text-green-700">Approved</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {pendingEnrollments.filter(e => e.status === 'rejected').length}
              </div>
              <div className="text-sm text-red-700">Rejected</div>
            </div>
          </div>
        </div>
      )} */}
    </div>
    </div>
  );
};

export default MyEnrollments;