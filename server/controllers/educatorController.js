import { v2 as cloudinary } from 'cloudinary'
import Course from '../models/Course.js';
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';
import { clerkClient } from '@clerk/express'
import PendingEnrollment from '../models/PendingEnrollment.js';

// Toggle Course Status (Published/Unpublished)
export const toggleCourseStatus = async (req, res) => {
    try {
        const { courseId, isPublished } = req.body
        const educatorId = req.auth.userId

        // Verify that the course belongs to the authenticated educator
        const course = await Course.findOne({ _id: courseId, educator: educatorId })

        if (!course) {
            return res.json({ success: false, message: 'Course not found or unauthorized' })
        }

        // Update the course status
        course.isPublished = isPublished
        await course.save()

        res.json({ 
            success: true, 
            message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
            course: {
                _id: course._id,
                isPublished: course.isPublished
            }
        })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// update role to educator
export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            },
        })

        res.json({ success: true, message: 'You can publish a course now' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Add New Course
export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body
        const imageFile = req.file
        const educatorId = req.auth.userId

        if (!imageFile) {
            return res.json({ success: false, message: 'Thumbnail Not Attached' })
        }

        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.educator = educatorId

        const newCourse = await Course.create(parsedCourseData)
        const imageUpload = await cloudinary.uploader.upload(imageFile.path)

        newCourse.courseThumbnail = imageUpload.secure_url
        await newCourse.save()

        res.json({ success: true, message: 'Course Added' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
    try {
        const educator = req.auth.userId
        const courses = await Course.find({ educator })
        res.json({ success: true, courses })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Educator Dashboard Data (Total Earning, Enrolled Students, No. of Courses)
export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.auth.userId;

        const courses = await Course.find({ educator });
        const totalCourses = courses.length;
        const courseIds = courses.map(course => course._id);

        // Calculate total earnings from purchases
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        });

        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        // Collect unique enrolled student IDs with their course titles
        const enrolledStudentsData = [];
        for (const course of courses) {
            const students = await User.find({
                _id: { $in: course.enrolledStudents }
            }, 'name imageUrl');

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                });
            });
        }

        res.json({
            success: true,
            dashboardData: {
                totalEarnings,
                enrolledStudentsData,
                totalCourses
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Enrolled Students Data with Purchase Data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth.userId;

        // Fetch all courses created by the educator
        const courses = await Course.find({ educator });
        const courseIds = courses.map(course => course._id);

        // Fetch purchases with user and course data
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle');

        // enrolled students data
        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({
            success: true,
            enrolledStudents
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get Pending Enrollments for educator's courses
export const getPendingEnrollments = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const { page = 1, limit = 10, status = 'pending' } = req.query;

        // Get educator's courses
        const courses = await Course.find({ educator });
        const courseIds = courses.map(course => course._id);

        // Find pending enrollments for educator's courses
        const pendingEnrollments = await PendingEnrollment.find({ 
            courseId: { $in: courseIds },
            status 
        })
        .populate('userId', 'name email imageUrl')
        .populate('courseId', 'courseTitle courseThumbnail price')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const total = await PendingEnrollment.countDocuments({ 
            courseId: { $in: courseIds },
            status 
        });

        res.json({
            success: true,
            enrollments: pendingEnrollments,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Process Enrollment Request (approve/reject)
export const processEnrollmentRequest = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'
        const educatorId = req.auth.userId;

        const pendingEnrollment = await PendingEnrollment.findById(enrollmentId);

        if (!pendingEnrollment) {
            return res.json({ success: false, message: 'Enrollment request not found' });
        }

        // Verify that the course belongs to the educator
        const course = await Course.findOne({ 
            _id: pendingEnrollment.courseId, 
            educator: educatorId 
        });

        if (!course) {
            return res.json({ success: false, message: 'Unauthorized: Course does not belong to you' });
        }

        if (pendingEnrollment.status !== 'pending') {
            return res.json({ success: false, message: 'Enrollment request already processed' });
        }

        if (action === 'approve') {
            // Approve the enrollment
            const userData = await User.findById(pendingEnrollment.userId);
            const courseData = await Course.findById(pendingEnrollment.courseId);

            // Add user to course
            courseData.enrolledStudents.push(userData._id);
            await courseData.save();

            // Add course to user
            userData.enrolledCourses.push(courseData._id);
            await userData.save();

            // Create purchase record for tracking
            await Purchase.create({
                userId: pendingEnrollment.userId,
                courseId: pendingEnrollment.courseId,
                amount: courseData.price,
                status: 'completed',
                paymentMethod: 'qr_code',
                transactionId: pendingEnrollment.transactionId
            });

            // Update pending enrollment
            pendingEnrollment.status = 'approved';
            pendingEnrollment.processedAt = new Date();
            pendingEnrollment.processedBy = educatorId;
            await pendingEnrollment.save();

            res.json({ success: true, message: 'Enrollment approved successfully' });

        } else if (action === 'reject') {
            // Reject the enrollment
            pendingEnrollment.status = 'rejected';
            pendingEnrollment.processedAt = new Date();
            pendingEnrollment.processedBy = educatorId;
            pendingEnrollment.rejectionReason = rejectionReason || 'No reason provided';
            await pendingEnrollment.save();

            res.json({ success: true, message: 'Enrollment rejected successfully' });

        } else {
            res.json({ success: false, message: 'Invalid action' });
        }

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};