import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Navbar = () => {

  const location = useLocation();

  const isCoursesListPage = location.pathname.includes('/course-list');

  const { backendUrl, isEducator, setIsEducator, navigate, getToken } = useContext(AppContext)

  const { openSignIn } = useClerk()
  const { user } = useUser()

  const becomeEducator = async () => {

    try {

      if (isEducator) {
        navigate('/educator')
        return;
      }

      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/educator/update-role', { headers: { Authorization: `Bearer ${token}` } })
      if (data.success) {
        toast.success(data.message)
        setIsEducator(true)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 py-4 ${isCoursesListPage ? 'bg-white' : 'bg-[#F9ECE2]'}`}>
      {/* Styled Logo */}
      <img 
        onClick={() => navigate('/')} 
        src={assets.lms_logo1} 
        alt="Logo" 
        className="w-16 h-16 lg:w-20 lg:h-20 cursor-pointer rounded-full object-cover bg-white/10 p-2  hover:shadow-lg transition-shadow duration-300" 
      />

      {/* Desktop Navigation */}
      <div className="md:flex hidden items-center gap-6 text-gray-600">
        <div className="flex items-center gap-6">
          {user && (
            <>
              {/* Become Educator Button */}
              {/* <button 
                onClick={becomeEducator}
                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all duration-200 hover:shadow-md"
              >
                {isEducator ? 'Educator Dashboard' : 'Become Educator'}
              </button>
               */}
              {/* Enhanced My Enrollments Button */}
              <Link 
                to='/my-enrollments'
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                My Enrollments
              </Link>
            </>
          )}
        </div>
        
        {/* User Section */}
        {user
          ? <UserButton />
          : <button 
              onClick={() => openSignIn()} 
              className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200"
            >
              Sign In
            </button>
        }
      </div>

      {/* Mobile Navigation */}
      <div className='md:hidden flex items-center gap-2 sm:gap-4 text-gray-600'>
        <div className="flex items-center gap-2 max-sm:text-xs">
          {user && (
            <>
              {/* Mobile Become Educator Button */}
              <button 
                onClick={becomeEducator}
                className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded transition-colors duration-200"
              >
                {isEducator ? 'Dashboard' : 'Educator'}
              </button>
              
              {/* Mobile My Enrollments Button */}
              <Link 
                to='/my-enrollments'
                className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-md shadow-md transition-all duration-200 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Enrollments
              </Link>
            </>
          )}
        </div>
        
        {/* Mobile User Section */}
        {user
          ? <UserButton />
          : <button onClick={() => openSignIn()}>
              <img src={assets.user_icon} alt="Sign In" className="w-6 h-6" />
            </button>
        }
      </div>
    </div>
  );
};

export default Navbar;