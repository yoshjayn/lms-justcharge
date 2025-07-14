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

  // Get enrollment button text and style
  const getEnrollmentButtonConfig = () => {
    if (isAlreadyEnrolled) {
      return {
        text: 'Already Enrolled',
        style: 'bg-green-600 text-white cursor-default',
        disabled: true
      };
    }

    if (enrollmentStatus?.status === 'pending') {
      return {
        text: 'Enrollment Pending Approval',
        style: 'bg-yellow-500 text-white cursor-not-allowed',
        disabled: true
      };
    }

    if (enrollmentStatus?.status === 'rejected') {
      return {
        text: 'Try Enroll Again',
        style: 'bg-red-600 text-white hover:bg-red-700',
        disabled: false
      };
    }

    return {
      text: `Enroll Now - ${currency}${courseData?.price || 0}`,
      style: 'bg-blue-600 text-white hover:bg-blue-700',
      disabled: false
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
    <>
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
                  alt=''
                  className='w-3.5 h-3.5' 
                />
              ))}
            </div>
            <p className='text-blue-600'>
              ({courseData.courseRatings.length} {courseData.courseRatings.length > 1 ? 'ratings' : 'rating'})
            </p>
            <p>
              {courseData.enrolledStudents.length} {courseData.enrolledStudents.length > 1 ? 'students' : 'student'}
            </p>
          </div>

          <p className='text-sm'>
            Course by <span className='text-blue-600 underline'>{courseData.educator.name}</span>
          </p>

          {/* Course Structure */}
          <div className="pt-8 text-gray-800">
            <h2 className="text-xl font-semibold">Course Structure</h2>
            <div className="pt-5">
              {courseData.courseContent.map((chapter, index) => (
                <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggleSection(index)}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={assets.down_arrow_icon} 
                        alt="arrow icon" 
                        className={`transform transition-transform ${openSections[index] ? "rotate-180" : ""}`} 
                      />
                      <p className="font-medium md:text-base text-sm">{chapter.chapterTitle}</p>
                    </div>
                    <p className="text-sm md:text-default">
                      {chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}
                    </p>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ${
                    openSections[index] ? "max-h-96" : "max-h-0"
                  }`}>
                    <div className="px-4 pb-3">
                      {chapter.chapterContent.map((lecture, lectureIndex) => (
                        <div key={lectureIndex} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center gap-2">
                            <img src={assets.play_icon} alt="play icon" className="w-4 h-4" />
                            <p className="text-sm text-gray-700">{lecture.lectureTitle}</p>
                            {lecture.isPreviewFree && (
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                Free Preview
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ["m"] })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Course Preview and Enrollment */}
        <div className="md:w-96 w-full bg-white border rounded-lg shadow-lg overflow-hidden z-10">
          {/* Video/Thumbnail Preview */}
          <div className="aspect-video">
            {playerData ? (
              <YouTube 
                videoId={playerData.videoId} 
                opts={{ playerVars: { autoplay: 1 } }} 
                iframeClassName='w-full aspect-video' 
              />
            ) : (
              <img src={courseData.courseThumbnail} alt={courseData.courseTitle} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="p-5">
            {/* Price and Offer */}
            <div className="flex items-center gap-2">
              <img className="w-3.5" src={assets.time_left_clock_icon} alt="time left clock icon" />
              <p className="text-red-500">
                <span className="font-medium">5 days</span> left at this price!
              </p>
            </div>

            <div className="flex gap-3 items-center pt-2">
              <p className="text-gray-800 md:text-4xl text-2xl font-semibold">
                {currency}{(courseData.price - courseData.discount * courseData.price / 100).toFixed(2)}
              </p>
              <p className="md:text-lg text-gray-500 line-through">{currency}{courseData.price}</p>
              <p className="md:text-lg text-gray-500">{courseData.discount}% off</p>
            </div>

            {/* Course Stats */}
            <div className="flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500">
              <div className="flex items-center gap-1">
                <img src={assets.star} alt="star icon" />
                <p>{calculateRating(courseData)}</p>
              </div>
              <div className="h-4 w-px bg-gray-500/40"></div>
              <div className="flex items-center gap-1">
                <img src={assets.time_clock_icon} alt="clock icon" />
                <p>{calculateCourseDuration(courseData)}</p>
              </div>
              <div className="h-4 w-px bg-gray-500/40"></div>
              <div className="flex items-center gap-1">
                <img src={assets.lesson_icon} alt="lesson icon" />
                <p>{calculateNoOfLectures(courseData)} lessons</p>
              </div>
            </div>

            {/* Enrollment Status Message */}
            {enrollmentStatus && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                enrollmentStatus.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
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

            {/* Enrollment Button - Now navigates to QR payment page */}
            <button 
              onClick={handleEnrollClick}
              disabled={buttonConfig.disabled}
              className={`md:mt-6 mt-4 w-full py-3 rounded font-medium transition-colors ${buttonConfig.style}`}
            >
              {buttonConfig.text}
            </button>

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

            {/* Quick Links for Enrolled Users */}
            {isAlreadyEnrolled && (
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
            {enrollmentStatus && (
              <div className="pt-4">
                <button
                  onClick={() => navigate(`/enrollment-status/${courseData._id}`)}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                >
                  View Enrollment Status
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Description Section */}
      <div className="md:px-36 px-8 py-16">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Course Description</h2>
          <div 
            className="prose prose-lg max-w-none text-gray-600"
            dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
          />
        </div>
      </div>

      {/* Instructor Section */}
      <div className="md:px-36 px-8 py-16 bg-gray-50">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Meet Your Instructor</h2>
          <div className="flex items-start gap-6">
            <img 
              src={courseData.educator.imageUrl || assets.profile_img} 
              alt={courseData.educator.name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{courseData.educator.name}</h3>
              <p className="text-gray-600 mt-2">
                Experienced instructor with expertise in {courseData.courseTitle.split(' ').slice(0, 3).join(' ')}.
                Passionate about teaching and helping students achieve their learning goals.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CourseDetails;