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
    const userId = req.auth.userId;
    const { courseId, transactionId } = req.body;
    const screenshotFile = req.file;

    if (!screenshotFile) {
      return res.json({ success: false, message: 'Payment screenshot is required' });
    }

    if (!transactionId) {
      return res.json({ success: false, message: 'Transaction ID is required' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.json({ success: false, message: 'Course not found' });
    }

    // Check if user already has a pending enrollment for this course
    const existingPending = await PendingEnrollment.findOne({
      userId,
      courseId,
      status: 'pending'
    });

    if (existingPending) {
      return res.json({ success: false, message: 'You already have a pending enrollment for this course' });
    }

    // Check if user is already enrolled
    const user = await User.findById(userId);
    if (user.enrolledCourses.includes(courseId)) {
      return res.json({ success: false, message: 'You are already enrolled in this course' });
    }

    // Upload screenshot to cloudinary
    const imageUpload = await cloudinary.uploader.upload(screenshotFile.path);

    // Create pending enrollment
    const pendingEnrollment = new PendingEnrollment({
      userId,
      courseId,
      paymentScreenshot: imageUpload.secure_url,
      transactionId
    });

    await pendingEnrollment.save();

    res.json({ 
      success: true, 
      message: 'Enrollment request submitted successfully. Please wait for admin approval.',
      enrollmentId: pendingEnrollment._id
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
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

//  -------------------------------------------------------------------

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
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2),
        }

        const newPurchase = await Purchase.create(purchaseData)

        // Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        // Creating line items to for Stripe
        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle
                },
                unit_amount: Math.floor(newPurchase.amount) * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        })

        res.json({ success: true, session_url: session.url });


    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Users Enrolled Courses With Lecture Links
export const userEnrolledCourses = async (req, res) => {

    try {

        const userId = req.auth.userId

        const userData = await User.findById(userId)
            .populate('enrolledCourses')

        res.json({ success: true, enrolledCourses: userData.enrolledCourses })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Update User Course Progress
export const updateUserCourseProgress = async (req, res) => {

    try {

        const userId = req.auth.userId

        const { courseId, lectureId } = req.body

        const progressData = await CourseProgress.findOne({ userId, courseId })

        if (progressData) {

            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture Already Completed' })
            }

            progressData.lectureCompleted.push(lectureId)
            await progressData.save()

        } else {

            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            })

        }

        res.json({ success: true, message: 'Progress Updated' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// get User Course Progress
export const getUserCourseProgress = async (req, res) => {

    try {

        const userId = req.auth.userId

        const { courseId } = req.body

        const progressData = await CourseProgress.findOne({ userId, courseId })

        res.json({ success: true, progressData })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Add User Ratings to Course
export const addUserRating = async (req, res) => {

    const userId = req.auth.userId;
    const { courseId, rating } = req.body;

    // Validate inputs
    if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
        return res.json({ success: false, message: 'InValid Details' });
    }

    try {
        // Find the course by ID
        const course = await Course.findById(courseId);

        if (!course) {
            return res.json({ success: false, message: 'Course not found.' });
        }

        const user = await User.findById(userId);

        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: 'User has not purchased this course.' });
        }

        // Check is user already rated
        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId);

        if (existingRatingIndex > -1) {
            // Update the existing rating
            course.courseRatings[existingRatingIndex].rating = rating;
        } else {
            // Add a new rating
            course.courseRatings.push({ userId, rating });
        }

        await course.save();

        return res.json({ success: true, message: 'Rating added' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};