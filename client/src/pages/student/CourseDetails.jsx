// Updated CourseDetails.jsx with proper structure and closed tags

import React, { useContext, useEffect, useState } from 'react';
import Footer from '../../components/student/Footer';
import { assets } from '../../assets/assets';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import humanizeDuration from 'humanize-duration';
import YouTube from 'react-youtube';
import { useAuth } from '@clerk/clerk-react';
import Loading from '../../components/student/Loading';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State variables
  const [courseData, setCourseData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [openSections, setOpenSections] = useState({});

  // Context and auth
  const { 
    backendUrl, 
    currency, 
    userData, 
    calculateChapterTime, 
    calculateCourseDuration, 
    calculateRating, 
    calculateNoOfLectures 
  } = useContext(AppContext);
  const { getToken } = useAuth();

  // Fetch course data
  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/course/' + id);

      if (data.success) {
        setCourseData(data.courseData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Check enrollment status
  const checkEnrollmentStatus = async () => {
    try {
      if (!userData || !courseData) return;

      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/user/enrollment-status/${courseData._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (data.success) {
        setEnrollmentStatus(data.enrollment);
      }
    } catch (error) {
      // No existing enrollment found, which is fine
      setEnrollmentStatus(null);
    }
  };

  // Remove rejected enrollment function
  const removeRejectedEnrollment = async () => {
    try {
      if (!enrollmentStatus || enrollmentStatus.status !== 'rejected') return;

      const token = await getToken();
      const response = await axios.delete(
        `${backendUrl}/api/user/remove-rejected-enrollment/${enrollmentStatus._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Enrollment removed successfully');
        setEnrollmentStatus(null);
        // Refresh the page or update state
        window.location.reload();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error removing enrollment:', error);
      toast.error('Error removing enrollment');
    }
  };

  // Toggle course section accordion
  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Handle enrollment button click - Navigate to QR Payment Page
  const handleEnrollClick = async () => {
    try {
      if (!userData) {
        return toast.warn('Login to Enroll');
      }

      if (isAlreadyEnrolled) {
        return toast.warn('Already Enrolled');
      }

      // Check if user has pending enrollment
      if (enrollmentStatus?.status === 'pending') {
        return toast.info('Your enrollment request is already pending approval');
      }

      if (enrollmentStatus?.status === 'rejected') {
        toast.warn('Your previous enrollment was rejected. You can try enrolling again.');
      }

      // Navigate to QR payment page instead of showing form on same page
      navigate(`/qr-payment/${courseData._id}`);

    } catch (error) {
      toast.error('Error initiating enrollment');
    }
  };

  // Get enrollment button text and style with proper rejection handling
  const getEnrollmentButtonConfig = () => {
    // Check if user is actually enrolled (approved and in enrolled courses)
    const isReallyEnrolled = isAlreadyEnrolled && (!enrollmentStatus || enrollmentStatus.status === 'approved');
    
    if (isReallyEnrolled) {
      return {
        text: 'Already Enrolled',
        style: 'bg-green-600 text-white cursor-default',
        disabled: true,
        showContinueLearning: true,
        showRemoveOption: false
      };
    }

    if (enrollmentStatus?.status === 'pending') {
      return {
        text: 'Enrollment Pending Approval',
        style: 'bg-yellow-500 text-white cursor-not-allowed',
        disabled: true,
        showContinueLearning: false,
        showRemoveOption: false
      };
    }

    if (enrollmentStatus?.status === 'rejected') {
      return {
        text: 'Try Enroll Again',
        style: 'bg-red-600 text-white hover:bg-red-700',
        disabled: false,
        showContinueLearning: false,
        showRemoveOption: true
      };
    }

    return {
      text: `Enroll Now - ${currency}${courseData?.coursePrice || 0}`,
      style: 'bg-blue-600 text-white hover:bg-blue-700',
      disabled: false,
      showContinueLearning: false,
      showRemoveOption: false
    };
  };

  // Effects
  useEffect(() => {
    fetchCourseData();
  }, [id]);

  useEffect(() => {
    if (userData && courseData) {
      setIsAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id));
      checkEnrollmentStatus();
    }
  }, [userData, courseData]);

  // Loading state
  if (!courseData) {
    return <Loading />;
  }

  const buttonConfig = getEnrollmentButtonConfig();

  return (
    <div>
      <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-20 pt-10 text-left">
        <div className="absolute top-0 left-0 w-full h-section-height -z-1 bg-gradient-to-b from-cyan-100/70"></div>

        {/* Left Side - Course Information */}
        <div className="max-w-xl z-10 text-gray-500">
          <h1 className="md:text-course-deatails-heading-large text-course-deatails-heading-small font-semibold text-gray-800">
            {courseData.courseTitle}
          </h1>
          <p 
            className="pt-4 md:text-base text-sm" 
            dangerouslySetInnerHTML={{ __html: courseData.courseDescription.slice(0, 200) }}
          />

          {/* Course Ratings and Stats */}
          <div className='flex items-center space-x-2 pt-3 pb-1 text-sm'>
            <p>{calculateRating(courseData)}</p>
            <div className='flex'>
              {[...Array(5)].map((_, i) => (
                <img 
                  key={i} 
                  src={i < Math.floor(calculateRating(courseData)) ? assets.star : assets.star_blank} 
                  alt='star'
                  className='w-3.5 h-3.5' 
                />
              ))}
            </div>
            <p className='text-blue-600'>
              ({courseData.courseRatings ? courseData.courseRatings.length : 0} {courseData.courseRatings && courseData.courseRatings.length > 1 ? 'ratings' : 'rating'})
            </p>
          </div>

          {/* Course Details */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>📚 {calculateNoOfLectures(courseData)} lessons</p>
            <p>⏱️ {humanizeDuration(calculateCourseDuration(courseData) * 1000, { round: true })}</p>
            <p>👨‍🎓 {courseData.enrolledStudents ? courseData.enrolledStudents.length : 0} students enrolled</p>
          </div>

          {/* Course Preview Video */}
          {courseData.coursePreview && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Course Preview</h3>
              <YouTube
                videoId={courseData.coursePreview}
                opts={{
                  width: '100%',
                  height: '300',
                  playerVars: {
                    autoplay: 0,
                  },
                }}
              />
            </div>
          )}

          {/* Course Curriculum */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Course Curriculum</h3>
            <div className="space-y-2">
              {courseData.courseSections && courseData.courseSections.length > 0 ? (
                courseData.courseSections.map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{section.sectionTitle}</h4>
                      <span className="text-gray-500">
                        {openSections[index] ? '▼' : '▶'}
                      </span>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <span>{section.sectionData ? section.sectionData.length : 0} lessons</span>
                      <span className="mx-2">•</span>
                      <span>{section.sectionData ? humanizeDuration(calculateChapterTime(section.sectionData) * 1000, { round: true }) : '0 min'}</span>
                    </div>
                  </button>
                  
                  {openSections[index] && (
                    <div className="px-4 pb-4">
                      {section.sectionData && section.sectionData.length > 0 ? (
                        section.sectionData.map((lesson, lessonIndex) => (
                          <div key={lessonIndex} className="py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{lesson.lectureTitle}</span>
                              <span className="text-xs text-gray-500">
                                {Math.floor(lesson.lectureDuration / 60)}:{String(lesson.lectureDuration % 60).padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No lessons available</p>
                      )}
                    </div>
                  )}
                </div>
              ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No course curriculum available</p>
                </div>
              )}}
            </div>
          </div>
        </div>

        {/* Right Side - Course Purchase Card */}
        <div className="md:w-80 w-full bg-white rounded-lg shadow-lg p-6 sticky top-4">
          <div className="relative">
            <img 
              src={courseData.courseThumbnail} 
              alt={courseData.courseTitle}
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {currency}{courseData.coursePrice}
            </div>
          </div>

          {/* Enrollment Status Display */}
          {enrollmentStatus && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              enrollmentStatus.status === 'pending' ? 
                'bg-yellow-100 text-yellow-800' :
                enrollmentStatus.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-green-100 text-green-800'
              }`}>
                {enrollmentStatus.status === 'pending' && (
                  <div>
                    <p className="font-semibold">⏳ Enrollment Pending</p>
                    <p>Your request is being reviewed by our admin team.</p>
                  </div>
                )}
                {enrollmentStatus.status === 'rejected' && (
                  <div>
                    <p className="font-semibold">❌ Enrollment Rejected</p>
                    <p>Reason: {enrollmentStatus.rejectionReason}</p>
                    <p className="mt-1">You can try enrolling again.</p>
                  </div>
                )}
                {enrollmentStatus.status === 'approved' && (
                  <div>
                    <p className="font-semibold">✅ Enrollment Approved</p>
                    <p>You can now access the course!</p>
                  </div>
                )}
              </div>
            )}

            {/* Enrollment Button */}
            <button 
              onClick={handleEnrollClick}
              disabled={buttonConfig.disabled}
              className={`md:mt-6 mt-4 w-full py-3 rounded font-medium transition-colors ${buttonConfig.style}`}
            >
              {buttonConfig.text}
            </button>

            {/* Remove Rejected Enrollment Button */}
            {buttonConfig.showRemoveOption && (
              <button 
                onClick={removeRejectedEnrollment}
                className="mt-2 w-full py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
              >
                Remove Rejected Request
              </button>
            )}

            {/* Course Features */}
            <div className="pt-6">
              <p className="md:text-xl text-lg font-medium text-gray-800">What's in the course?</p>
              <ul className="ml-4 pt-2 text-sm md:text-default list-disc text-gray-500">
                <li>Lifetime access with free updates.</li>
                <li>Step-by-step, hands-on project guidance.</li>
                <li>Downloadable resources and source code.</li>
                <li>Quizzes to test your knowledge.</li>
                <li>Certificate of completion.</li>
              </ul>
            </div>

            {/* Continue Learning Button for Enrolled Users */}
            {buttonConfig.showContinueLearning && (
              <div className="pt-4 border-t border-gray-200 mt-4">
                <button
                  onClick={() => navigate(`/player/${courseData._id}`)}
                  className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Continue Learning
                </button>
              </div>
            )}

            {/* Quick Link for Pending/Approved Status */}
            {enrollmentStatus && enrollmentStatus.status !== 'rejected' && (
              <div className="pt-4">
                <button
                  onClick={() => navigate(`/enrollment-status/${courseData._id}`)}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                >
                  View Status Details
                </button>
              </div>
            )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseDetails;