import express from 'express'
import { 
    submitQRPaymentEnrollment, 
    checkEnrollmentStatus, 
    getMyPendingEnrollments,
    removeRejectedEnrollment,
    addUserRating, 
    getUserCourseProgress, 
    getUserData, 
    purchaseCourse, 
    updateUserCourseProgress, 
    userEnrolledCourses 
} from '../controllers/userController.js';
import upload from '../configs/multer.js'; 
import { protectUser } from '../middlewares/authMiddleware.js';
import User from '../models/User.js'; // ✅ ADD THIS IMPORT

const userRouter = express.Router()

// QR Code payment enrollment
userRouter.post('/enroll-qr', protectUser, upload.single('screenshot'), submitQRPaymentEnrollment);

// Check enrollment status
userRouter.get('/enrollment-status/:courseId', protectUser, checkEnrollmentStatus);

// Get user's pending enrollments
userRouter.get('/my-pending-enrollments', protectUser, getMyPendingEnrollments);

// Remove rejected enrollment
userRouter.delete('/remove-rejected-enrollment/:enrollmentId', protectUser, removeRejectedEnrollment);

// ✅ FIXED: User routes - Added missing protectUser middleware
userRouter.get('/data', protectUser, getUserData)
userRouter.post('/purchase', protectUser, purchaseCourse)
userRouter.get('/enrolled-courses', protectUser, userEnrolledCourses)
userRouter.post('/update-course-progress', protectUser, updateUserCourseProgress)
userRouter.post('/get-course-progress', protectUser, getUserCourseProgress)
userRouter.post('/add-rating', protectUser, addUserRating)

// ✅ NEW: Debug endpoints
userRouter.get('/debug-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Searching for user ID:', userId);
    
    const user = await User.findById(userId);
    console.log('📊 User found:', user ? 'YES' : 'NO');
    
    if (user) {
      console.log('👤 User data:', {
        id: user._id,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl
      });
    }
    
    const allUsers = await User.find({}).limit(10);
    console.log('📋 Total users in database:', allUsers.length);
    
    res.json({
      success: true,
      userExists: !!user,
      userData: user,
      totalUsersInDB: allUsers.length,
      sampleUsers: allUsers.map(u => ({ id: u._id, email: u.email }))
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.json({ success: false, error: error.message });
  }
});

userRouter.get('/debug-clerk-user', protectUser, (req, res) => {
  try {
    const userId = req.auth.userId;
    console.log('🔐 Clerk User ID from token:', userId);
    
    res.json({
      success: true,
      clerkUserId: userId,
      authObject: req.auth
    });
    
  } catch (error) {
    console.error('❌ Clerk debug error:', error);
    res.json({ success: false, error: error.message });
  }
});

// ✅ NEW: Manual user creation endpoint
userRouter.post('/create-missing-user', protectUser, async (req, res) => {
  try {
    const userId = req.auth.userId;
    console.log('🔧 Attempting to create user:', userId);
    
    // Check if user already exists
    const existingUser = await User.findById(userId);
    if (existingUser) {
      return res.json({
        success: true,
        message: 'User already exists',
        user: existingUser
      });
    }
    
    // Get user info from request body
    const { email, name, imageUrl } = req.body;
    
    if (!email) {
      return res.json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Create user in database
    const userData = {
      _id: userId,
      email: email,
      name: name || 'User',
      imageUrl: imageUrl || '',
      enrolledCourses: []
    };
    
    const newUser = await User.create(userData);
    console.log('✅ User created successfully:', newUser);
    
    res.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

export default userRouter;