import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { UserButton, useUser } from '@clerk/clerk-react';

const Navbar = ({ bgColor }) => {

  const { isEducator, navigate } = useContext(AppContext)
  const { user } = useUser()

   if (!isEducator || !user) return null

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    user.emailAddresses?.[0]?.emailAddress || ''

  return isEducator && user && (
    
    <div className={`bg-[#F9ECE2] flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3 ${bgColor}`}>
      <Link to="/">
      <img
                onClick={() => navigate('/')}
                src={assets.lms_logo1}
                alt="Logo" 
                className="w-16 h-16 lg:w-20 lg:h-20 cursor-pointer rounded-full object-cover bg-white/10 p-2  hover:shadow-lg transition-shadow duration-300" 
              />
      </Link>
      
      <div className="flex items-center gap-5 text-gray-500 relative">
        <p>Hi! {displayName}</p>
        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;