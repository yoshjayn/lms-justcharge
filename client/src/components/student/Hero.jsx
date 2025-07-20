import React from 'react';
import { assets } from '../../assets/assets';
import SearchBar from '../../components/student/SearchBar';

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full md:pt-36 pt-20 px-7 md:px-0 space-y-7 text-center bg-[#F9ECE2]">
      <h1 className="md:text-home-heading-large text-home-heading-small relative font-bold text-gray-800 max-w-3xl mx-auto">
        Guiding you through the stars to 
        <span className="text-red-600"> clarity, purpose, and peace.</span>
        <img src={assets.sketch} alt="sketch" className="md:block hidden absolute -bottom-7 right-0" />
      </h1>
      <p className="md:block hidden text-gray-500 max-w-2xl mx-auto">
        Choose your session, select your time, and receive divine guidance aligned with the stars.
      </p>
      <p className="md:hidden text-gray-500 max-w-sm mx-auto">
        Choose your session, select your time, and receive divine guidance aligned with the stars.
      </p>
      <SearchBar />
    </div>
  );
};

export default Hero;
