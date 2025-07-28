import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext()

export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const currency = import.meta.env.VITE_CURRENCY

    const navigate = useNavigate()
    const { getToken } = useAuth()
    const { user } = useUser()

    const [isAdmin, setIsAdmin] = useState(false);

    const [showLogin, setShowLogin] = useState(false)
    const [isEducator, setIsEducator] = useState(false)
    const [allCourses, setAllCourses] = useState([])
    const [userData, setUserData] = useState(null)
    const [enrolledCourses, setEnrolledCourses] = useState([])

    // Fetch All Courses
    const fetchAllCourses = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/course/all');

            if (data.success) {
                setAllCourses(data.courses)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    // Fetch UserData 
    // const fetchUserData = async () => {

    //     try {

    //         if (user.publicMetadata.role === 'educator') {
    //             setIsEducator(true)
    //         }

    //         if (user.publicMetadata.role === 'admin') {
    //             setIsAdmin(true);
    //             setIsEducator(true); 
    //         }

            
    //         const token = await getToken();

    //         const { data } = await axios.get(backendUrl + '/api/user/data',
    //             { headers: { Authorization: `Bearer ${token}` } })

    //         if (data.success) {
    //             setUserData(data.user)
    //             console.log(userData,'appcontext')
    //         } else {
    //             toast.error(data.message)
    //         }

    //     } catch (error) {
    //         toast.error(error.message)
    //     }

    // }
    // Enhanced fetchUserData function with comprehensive debugging
// Add this to your AppContext.jsx

const fetchUserData = async () => {
    try {
        console.log('🔄 fetchUserData called');
        
        if (!user) {
            console.log('❌ No user object available');
            return;
        }

        console.log('👤 User object available:', {
            id: user.id,
            hasEmailAddresses: !!user.emailAddresses?.length,
            primaryEmail: user.primaryEmailAddress?.emailAddress
        });

        if (user.publicMetadata?.role === 'educator') {
            setIsEducator(true)
        }

        if (user.publicMetadata?.role === 'admin') {
            setIsAdmin(true);
            setIsEducator(true);
        }

        console.log('🔄 Getting token...');
        const token = await getToken();
        
        console.log('🔍 Token details:', {
            hasToken: !!token,
            tokenLength: token?.length,
            tokenStart: token?.substring(0, 20) + '...',
            tokenType: typeof token
        });
        
        if (!token) {
            console.log('❌ No token received from getToken()');
            console.log('🔍 User authentication state:', {
                isSignedIn: !!user,
                hasId: !!user?.id,
                hasEmailAddresses: !!user?.emailAddresses?.length
            });
            return;
        }

        console.log('🔄 Making API call to fetch user data...');
        console.log('🔍 Request details:', {
            url: backendUrl + '/api/user/data',
            method: 'GET',
            hasAuthHeader: true,
            authHeaderStart: `Bearer ${token.substring(0, 20)}...`
        });

        const { data } = await axios.get(backendUrl + '/api/user/data', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('📨 API Response:', data);

        if (data.success) {
            console.log('✅ User data loaded successfully:', data.user);
            setUserData(data.user);
        } else if (data.message === 'User Not Found') {
            console.log('👤 User not found in database, attempting to create...');
            
            try {
                const createResponse = await axios.post(backendUrl + '/api/user/create-missing-user', {
                    email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress,
                    name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    imageUrl: user.imageUrl || ''
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('🔧 Create user response:', createResponse.data);

                if (createResponse.data.success) {
                    console.log('✅ User created successfully, setting userData');
                    setUserData(createResponse.data.user);
                    toast.success('Welcome! Your account has been set up.');
                } else {
                    console.log('❌ Failed to create user:', createResponse.data.error);
                    toast.error('Failed to set up your account. Please try refreshing the page.');
                }
            } catch (createError) {
                console.error('❌ Error creating user:', createError);
                toast.error('Failed to set up your account. Please contact support.');
            }
        } else {
            console.log('❌ API returned error:', data.message);
            console.log('🔍 Full error response:', data);
            toast.error(data.message);
        }

    } catch (error) {
        console.error('❌ Error in fetchUserData:', error);
        console.log('🔍 Error details:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            responseData: error.response?.data
        });
        toast.error('Failed to load user data: ' + error.message);
    }
}
    // Fetch User Enrolled Courses
    const fetchUserEnrolledCourses = async () => {

        const token = await getToken();

        const { data } = await axios.get(backendUrl + '/api/user/enrolled-courses',
            { headers: { Authorization: `Bearer ${token}` } })

        if (data.success) {
            setEnrolledCourses(data.enrolledCourses.reverse())
        } else {
            toast.error(data.message)
        }

    }

    // Function to Calculate Course Chapter Time
    const calculateChapterTime = (chapter) => {

        let time = 0

        chapter.chapterContent.map((lecture) => time += lecture.lectureDuration)

        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] })

    }

    // Function to Calculate Course Duration
    const calculateCourseDuration = (course) => {

        let time = 0

        course.courseContent.map(
            (chapter) => chapter.chapterContent.map(
                (lecture) => time += lecture.lectureDuration
            )
        )

        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] })

    }

    const calculateRating = (course) => {

        if (course.courseRatings.length === 0) {
            return 0
        }

        let totalRating = 0
        course.courseRatings.forEach(rating => {
            totalRating += rating.rating
        })
        return Math.floor(totalRating / course.courseRatings.length)
    }

    const calculateNoOfLectures = (course) => {
        let totalLectures = 0;
        course.courseContent.forEach(chapter => {
            if (Array.isArray(chapter.chapterContent)) {
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    }


    useEffect(() => {
        fetchAllCourses()
    }, [])

    // Fetch User's Data if User is Logged In
    useEffect(() => {
        if (user) {
            fetchUserData()
            fetchUserEnrolledCourses()
        }
    }, [user])

    const value = {
        showLogin, setShowLogin,
        backendUrl, currency, navigate,
        userData, setUserData, getToken,
        allCourses, fetchAllCourses,
        enrolledCourses, fetchUserEnrolledCourses,
        calculateChapterTime, calculateCourseDuration,
        calculateRating, calculateNoOfLectures,
        isEducator, setIsEducator
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}
