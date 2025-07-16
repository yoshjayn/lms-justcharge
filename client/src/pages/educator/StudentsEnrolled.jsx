import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const StudentsEnrolled = () => {
  const { backendUrl, getToken, isEducator } = useContext(AppContext);
  
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'enrolled'

  useEffect(() => {
    if (isEducator) {
      fetchData();
    }
  }, [isEducator]);

  const fetchData = async () => {
    try {
      const token = await getToken();
      
      // Fetch enrolled students
      const enrolledResponse = await axios.get(`${backendUrl}/api/educator/enrolled-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch pending enrollments
      const pendingResponse = await axios.get(`${backendUrl}/api/educator/pending-enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (enrolledResponse.data.success) {
        setEnrolledStudents(enrolledResponse.data.enrolledStudents.reverse());
      }

      if (pendingResponse.data.success) {
        setPendingEnrollments(pendingResponse.data.enrollments);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error fetching student data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId) => {
    if (processing) return;
    
    setProcessing(true);
    try {
      const token = await getToken();
      const response = await axios.post(`${backendUrl}/api/educator/process-enrollment/${enrollmentId}`, {
        action: 'approve'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Enrollment approved successfully');
        setSelectedEnrollment(null);
        fetchData(); // Refresh data
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error approving enrollment:', error);
      toast.error('Error approving enrollment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (enrollmentId) => {
    if (processing) return;
    
    setProcessing(true);
    try {
      const token = await getToken();
      const response = await axios.post(`${backendUrl}/api/educator/process-enrollment/${enrollmentId}`, {
        action: 'reject',
        rejectionReason: rejectionReason.trim() || 'No reason provided'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Enrollment rejected successfully');
        setSelectedEnrollment(null);
        setShowRejectModal(false);
        setRejectionReason('');
        fetchData(); // Refresh data
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
      toast.error('Error rejecting enrollment');
    } finally {
      setProcessing(false);
    }
  };

  const openTransactionDetails = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowRejectModal(false);
  };

  const closeModal = () => {
    setSelectedEnrollment(null);
    setShowRejectModal(false);
    setRejectionReason('');
  };

  const openRejectModal = () => {
    setShowRejectModal(true);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Management</h1>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Requests ({pendingEnrollments.length})
          </button>
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'enrolled'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Enrolled Students ({enrolledStudents.length})
          </button>
        </div>

        {/* Pending Enrollments Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {pendingEnrollments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-500">All enrollment requests have been processed.</p>
              </div>
            ) : (
              pendingEnrollments.map((enrollment) => (
                <div key={enrollment._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Student and Course Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={enrollment.userId.imageUrl}
                          alt="Student"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{enrollment.userId.name}</h3>
                          <p className="text-gray-600">{enrollment.userId.email}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h4 className="font-medium mb-3 text-gray-900">Course Details</h4>
                        <div className="flex items-center gap-3">
                          <img
                            src={enrollment.courseId.courseThumbnail}
                            alt="Course"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{enrollment.courseId.courseTitle}</p>
                            <p className="text-green-600 font-semibold">₹{enrollment.courseId.coursePrice}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p><strong>Transaction ID:</strong> {enrollment.transactionId}</p>
                        <p><strong>Submitted:</strong> {new Date(enrollment.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="lg:w-1/3 flex items-center justify-center">
                      <button
                        onClick={() => openTransactionDetails(enrollment)}
                        className="w-full bg-blue-600 text-white py-3.5 px-6 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Transaction Details
                      </button>
                    </div>

                    {/* Action Buttons */}
                    {/* <div className="lg:w-1/3 flex flex-col gap-3">
                      <button
                        onClick={() => openTransactionDetails(enrollment)}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        View Transaction Details
                      </button>
                      
                      <button
                        onClick={() => handleApprove(enrollment._id)}
                        disabled={processing}
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? 'Processing...' : 'Approve'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedEnrollment(enrollment);
                          setRejectionReason('');
                        }}
                        disabled={processing}
                        className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Decline
                      </button>
                    </div> */}


                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Enrolled Students Tab */}
        {activeTab === 'enrolled' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {enrolledStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-.83.67-1.5 1.5-1.5S12 9.67 12 10.5V18h2v-4h3v4h1v2H4v-2z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled students</h3>
                <p className="text-gray-500">Students will appear here once their enrollments are approved.</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrolledStudents.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={item.student.imageUrl}
                              alt=""
                              className="w-10 h-10 rounded-full mr-3"
                            />
                            <span className="text-sm font-medium text-gray-900">{item.student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.courseTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.purchaseDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transaction Details Modal */}
        {selectedEnrollment && !showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Transaction Details</h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Student Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={selectedEnrollment.userId.imageUrl}
                        alt="Student"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{selectedEnrollment.userId.name}</p>
                        <p className="text-gray-600 text-sm">{selectedEnrollment.userId.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Course Information</h4>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={selectedEnrollment.courseId.courseThumbnail}
                        alt="Course"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{selectedEnrollment.courseId.courseTitle}</p>
                        <p className="text-green-600 font-semibold">₹{selectedEnrollment.courseId.coursePrice}</p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Transaction Information</h4>
                    <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                      <p><strong>Transaction ID:</strong> {selectedEnrollment.transactionId}</p>
                      <p><strong>Submitted:</strong> {new Date(selectedEnrollment.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Payment Screenshot */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Payment Screenshot</h4>
                    <img
                      src={selectedEnrollment.paymentScreenshot}
                      alt="Payment Screenshot"
                      className="w-full max-w-md mx-auto rounded-lg border"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedEnrollment._id)}
                    disabled={processing}
                    className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 font-medium"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={openRejectModal}
                    disabled={processing}
                    className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {selectedEnrollment && showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Decline Enrollment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for declining this enrollment request. This will be sent to the student.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={processing}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedEnrollment._id)}
                  disabled={processing}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Declining...' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsEnrolled;