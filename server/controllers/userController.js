import Course from "../models/Course.js"
import { CourseProgress } from "../models/CourseProgress.js"
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"
import stripe from "stripe"
import PendingEnrollment from '../models/PendingEnrollment.js';
import { v2 as cloudinary } from 'cloudinary';

// New QR Code Payment Enrollment
export const submitQRPaymentEnrollment = async (req, res) => {
  try {
    console.log('Request received:', {
      body: req.body,
      file: req.file ? 'File present' : 'No file',
      userId: req.auth?.userId
    });

    const userId = req.auth.userId;
    const { courseId, transactionId } = req.body;
    const screenshotFile = req.file;

    // Enhanced validation with detailed error messages
    if (!screenshotFile) {
      console.log('No file received in request');
      return res.status(400).json({ 
        success: false, 
        message: 'Payment screenshot is required. Please select a file.' 
      });
    }

    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course ID is missing.' 
      });
    }

    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction ID is required.' 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required.' 
      });
    }

    console.log('File details:', {
      originalname: screenshotFile.originalname,
      mimetype: screenshotFile.mimetype,
      size: screenshotFile.size,
      path: screenshotFile.path
    });

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found.' 
      });
    }

    // Check if user already has a pending enrollment for this course
    const existingPending = await PendingEnrollment.findOne({
      userId,
      courseId,
      status: 'pending'
    });

    if (existingPending) {
      return res.status(409).json({ 
        success: false, 
        message: 'You already have a pending enrollment for this course.' 
      });
    }

    // Check if user is already enrolled
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    if (user.enrolledCourses.includes(courseId)) {
      return res.status(409).json({ 
        success: false, 
        message: 'You are already enrolled in this course.' 
      });
    }

    console.log('Uploading to Cloudinary...');

    // Upload screenshot to cloudinary with error handling
    const imageUpload = await cloudinary.uploader.upload(screenshotFile.path, {
      resource_type: "image",
      folder: "payment_screenshots",
      transformation: [
        { width: 1000, height: 1000, crop: "limit" },
        { quality: "auto" }
      ]
    });

    console.log('Cloudinary upload successful:', imageUpload.secure_url);

    // Create pending enrollment
    const pendingEnrollment = new PendingEnrollment({
      userId,
      courseId,
      paymentScreenshot: imageUpload.secure_url,
      cloudinaryPublicId: imageUpload.public_id,
      transactionId: transactionId.trim()
    });

    await pendingEnrollment.save();

    console.log('Enrollment request saved successfully');

    res.status(201).json({ 
      success: true, 
      message: 'Enrollment request submitted successfully. Please wait for admin approval.',
      enrollmentId: pendingEnrollment._id
    });

  } catch (error) {
    console.error('Error in submitQRPaymentEnrollment:', error);
    
    // Handle specific Cloudinary errors
    if (error.message.includes('cloudinary')) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to upload image. Please try again.' 
      });
    }
    
    // Handle Multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum 5MB allowed.' 
      });
    }
    
    if (error.message.includes('Only image files')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only image files are allowed.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    });
  }
};

// Check enrollment status
export const checkEnrollmentStatus = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId } = req.params;

    const pendingEnrollment = await PendingEnrollment.findOne({
      userId,
      courseId
    }).sort({ createdAt: -1 });

    if (!pendingEnrollment) {
      return res.json({ success: false, message: 'No enrollment request found' });
    }

    res.json({ 
      success: true, 
      enrollment: pendingEnrollment
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get user's pending enrollments
export const getMyPendingEnrollments = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const pendingEnrollments = await PendingEnrollment.find({ userId })
      .populate('courseId', 'courseTitle courseThumbnail price')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      enrollments: pendingEnrollments
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get User Data
export const getUserData = async (req, res) => {
    try {

        const userId = req.auth.userId

        const user = await User.findById(userId)

        if (!user) {
            return res.json({ success: false, message: 'User Not Found' })
        }

        res.json({ success: true, user })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Purchase Course 
export const purchaseCourse = async (req, res) => {

    try {

        const { courseId } = req.body
        const { origin } = req.headers


        const userId = req.auth.userId

        const courseData = await Course.findById(courseId)
        const userData = await User.findById(userId)

        if (!userData || !courseData) {
            return res.json({ success: false, message: 'Data Not Found' })
        }

        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: courseData.price,
            date: Date.now()
        }

        const newPurchase = new Purchase(purchaseData)

        await newPurchase.save()

        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/my-enrollments`,
            cancel_url: `${origin}/course/${courseId}`,
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: courseData.courseTitle
                    },
                    unit_amount: courseData.price * 100
                },
                quantity: 1
            }],
            mode: 'payment',
            metadata: {
                userId,
                courseId,
                purchaseId: newPurchase._id.toString()
            }
        })

        res.json({ success: true, sessionUrl: session.url })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get User Enrolled Courses
export const userEnrolledCourses = async (req, res) => {
    try {

        const userId = req.auth.userId

        const userData = await User.findById(userId)

        if (!userData) {
            return res.json({ success: false, message: 'User Not Found' })
        }

        const enrolledCourses = await Course.find({ _id: { $in: userData.enrolledCourses } })

        res.json({ success: true, courses: enrolledCourses })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Update User Course Progress
export const updateUserCourseProgress = async (req, res) => {
    try {

        const { courseId, chapterIndex, lessonIndex } = req.body

        const userId = req.auth.userId

        let courseProgress = await CourseProgress.findOne({ userId, courseId })

        if (!courseProgress) {
            courseProgress = new CourseProgress({
                userId,
                courseId,
                chaptersProgress: []
            })
        }

        // Ensure the chapters progress array has enough elements
        while (courseProgress.chaptersProgress.length <= chapterIndex) {
            courseProgress.chaptersProgress.push({ lessons: [] })
        }

        // Ensure the lessons array for the chapter has enough elements
        while (courseProgress.chaptersProgress[chapterIndex].lessons.length <= lessonIndex) {
            courseProgress.chaptersProgress[chapterIndex].lessons.push(false)
        }

        // Mark the lesson as completed
        courseProgress.chaptersProgress[chapterIndex].lessons[lessonIndex] = true

        await courseProgress.save()

        res.json({ success: true, message: 'Course Progress Updated' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get User Course Progress
export const getUserCourseProgress = async (req, res) => {
    try {

        const { courseId } = req.body

        const userId = req.auth.userId

        const courseProgress = await CourseProgress.findOne({ userId, courseId })

        res.json({ success: true, courseProgress })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Add User Course Rating
export const addUserRating = async (req, res) => {

    try {

        const { courseId, rating } = req.body

        const userId = req.auth.userId

        const courseData = await Course.findById(courseId)

        if (!courseData) {
            return res.json({ success: false, message: 'Course Not Found' })
        }

        const existingRatingIndex = courseData.courseRatings.findIndex(item => item.userId.toString() === userId)

        if (existingRatingIndex !== -1) {
            // If user has already rated, update the existing rating
            courseData.courseRatings[existingRatingIndex].rating = rating
        } else {
            // If user hasn't rated, add a new rating
            courseData.courseRatings.push({
                userId,
                rating
            })
        }

        await courseData.save()

        res.json({ success: true, message: 'Rating Added' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}