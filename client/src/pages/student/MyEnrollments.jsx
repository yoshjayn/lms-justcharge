import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';
import { assets } from '../../assets/assets';

const MyEnrollments = () => {
  const navigate = useNavigate();
  const { backendUrl, userData } = useContext(AppContext);
  const { getToken } = useAuth();
  
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData) {
      fetchUserEnrollments();
    }
  }, [userData]);

  const fetchUserEnrollments = async () => {
    try {
      const token = await getToken();
      
      // Fetch enrolled courses
      const enrolledResponse = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch pending enrollments
      const pendingResponse = await axios.get(`${backendUrl}/api/user/my-pending-enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (enrolledResponse.data.success) {
        setEnrolledCourses(enrolledResponse.data.courses);
      }

      if (pendingResponse.data.success) {
        setPendingEnrollments(pendingResponse.data.enrollments);
      }

    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Error fetching your enrollments');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Enrollments</h1>

      {/* Pending Enrollments Section */}
      {pendingEnrollments.length > 0 && (
        <div className="mb-12">
          {/* <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pending Enrollments</h2> */}
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
                    <p><strong>Price:</strong> ₹{enrollment.courseId.price}</p>
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

                  <div className="mt-4 flex gap-2">
                    {enrollment.status === 'approved' && (
                      <button
                        onClick={() => navigate(`/player/${enrollment.courseId._id}`)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors text-sm"
                      >
                        Start Learning
                      </button>
                    )}
                    
                    {enrollment.status === 'rejected' && (
                      <button
                        onClick={() => navigate(`/qr-payment/${enrollment.courseId._id}`)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        Try Again
                      </button>
                    )}
                    
                    {enrollment.status === 'pending' && (
                      <div className="flex-1 bg-gray-100 text-gray-500 py-2 px-4 rounded text-center text-sm">
                        Awaiting Approval
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Courses Section */}
      {/* <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Enrolled Courses</h2>
        
        {enrolledCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled courses yet</h3>
            <p className="text-gray-500 mb-4">Start your learning journey by enrolling in a course</p>
            <button
              onClick={() => navigate('/course-list')}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.map((course) => (
              <div key={course._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={course.courseThumbnail}
                    alt={course.courseTitle}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    ✅ ENROLLED
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {course.courseTitle}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.courseDescription?.replace(/<[^>]*>/g, '') || 'No description available'}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-sm text-gray-600">
                        {course.courseRatings?.length || 0} reviews
                      </span>
                    </div>
                    <span className="text-lg font-bold text-green-600">₹{course.price}</span>
                  </div>

                  <button
                    onClick={() => navigate(`/player/${course._id}`)}
                    className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                  >
                    Continue Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div> */}

      {/* Empty State for Both Sections */}
      {enrolledCourses.length === 0 && pendingEnrollments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-32 h-32 mx-auto mb-6 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-6">You haven't enrolled in any courses or submitted any enrollment requests yet.</p>
          <button
            onClick={() => navigate('/course-list')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Explore Courses
          </button>
        </div>
      )}
    </div>
  );
};

export default MyEnrollments;