import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PendingEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingEnrollments();
  }, []);

  const fetchPendingEnrollments = async () => {
    try {
      const response = await axios.get('/api/admin/pending-enrollments');
      if (response.data.success) {
        setEnrollments(response.data.enrollments);
      }
    } catch (error) {
      toast.error('Error fetching pending enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId) => {
    try {
      const response = await axios.post(`/api/admin/process-enrollment/${enrollmentId}`, {
        action: 'approve'
      });

      if (response.data.success) {
        toast.success('Enrollment approved successfully');
        fetchPendingEnrollments();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Error approving enrollment');
    }
  };

  const handleReject = async (enrollmentId) => {
    try {
      const response = await axios.post(`/api/admin/process-enrollment/${enrollmentId}`, {
        action: 'reject',
        rejectionReason
      });

      if (response.data.success) {
        toast.success('Enrollment rejected successfully');
        fetchPendingEnrollments();
        setSelectedEnrollment(null);
        setRejectionReason('');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Error rejecting enrollment');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Pending Enrollments</h2>
      
      {enrollments.length === 0 ? (
        <p className="text-gray-500">No pending enrollments</p>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <div key={enrollment._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{enrollment.courseId.courseTitle}</h3>
                  <p className="text-gray-600">Student: {enrollment.userId.name}</p>
                  <p className="text-gray-600">Email: {enrollment.userId.email}</p>
                  <p className="text-gray-600">Transaction ID: {enrollment.transactionId}</p>
                  <p className="text-gray-600">
                    Submitted: {new Date(enrollment.submittedAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="ml-4">
                  <img 
                    src={enrollment.paymentScreenshot} 
                    alt="Payment Screenshot" 
                    className="w-32 h-32 object-cover rounded-lg cursor-pointer"
                    onClick={() => window.open(enrollment.paymentScreenshot, '_blank')}
                  />
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleApprove(enrollment._id)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => setSelectedEnrollment(enrollment)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Enrollment</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows="3"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedEnrollment._id)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingEnrollments;
