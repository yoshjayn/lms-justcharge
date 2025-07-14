import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

const EnrollmentStatus = () => {
  const { courseId } = useParams();
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { backendUrl } = useContext(AppContext);
  const { getToken } = useAuth();

  useEffect(() => {
    fetchEnrollmentStatus();
  }, [courseId]);

  const fetchEnrollmentStatus = async () => {
    try {
      const token = await getToken();
      
      // Get enrollment status
      const enrollmentResponse = await axios.get(
        `${backendUrl}/api/user/enrollment-status/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Get course details
      const courseResponse = await axios.get(`${backendUrl}/api/course/${courseId}`);
      
      if (enrollmentResponse.data.success) {
        setEnrollmentData(enrollmentResponse.data.enrollment);
      }
      
      if (courseResponse.data.success) {
        setCourseData(courseResponse.data.courseData);
      }
      
    } catch (error) {
      console.error('Error fetching enrollment status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Enrollment Status</h1>
      
      {courseData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">{courseData.courseTitle}</h2>
          <p className="text-gray-600">Price: ₹{courseData.price}</p>
        </div>
      )}

      {enrollmentData ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className={`p-4 rounded-lg mb-4 ${
            enrollmentData.status === 'pending' ? 'bg-yellow-100' :
            enrollmentData.status === 'approved' ? 'bg-green-100' :
            'bg-red-100'
          }`}>
            <h3 className="font-semibold mb-2">
              Status: {enrollmentData.status.toUpperCase()}
            </h3>
            
            {enrollmentData.status === 'pending' && (
              <p>Your enrollment request is being reviewed by our admin team. We'll notify you once it's processed.</p>
            )}
            
            {enrollmentData.status === 'approved' && (
              <div>
                <p className="mb-3">Congratulations! Your enrollment has been approved.</p>
                <Link 
                  to={`/player/${courseId}`}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Start Learning
                </Link>
              </div>
            )}
            
            {enrollmentData.status === 'rejected' && (
              <div>
                <p className="mb-2">Unfortunately, your enrollment request was rejected.</p>
                {enrollmentData.rejectionReason && (
                  <p className="text-sm"><strong>Reason:</strong> {enrollmentData.rejectionReason}</p>
                )}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p>Transaction ID: {enrollmentData.transactionId}</p>
            <p>Submitted: {new Date(enrollmentData.submittedAt).toLocaleString()}</p>
            {enrollmentData.processedAt && (
              <p>Processed: {new Date(enrollmentData.processedAt).toLocaleString()}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p>No enrollment request found for this course.</p>
          <Link 
            to={`/course/${courseId}`}
            className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            Go back to course details
          </Link>
        </div>
      )}
    </div>
  );
};

export default EnrollmentStatus;
