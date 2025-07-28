import React from 'react';
import { assets } from '../../assets/assets';
import { Mail, MapPin, Phone } from "lucide-react";
import { BsInstagram } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-t w-full from-[#000000] via-[#26190B] to-[#26190B] text-white py-12 px-4 sm:px-6 lg:px-8 
      h-auto lg:h-[450px] overflow-hidden">
      <div className="max-w-7xl pt-10 mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-start gap-10">
        <div className="flex flex-col items-start text-left space-y-6">
          <div className="mb-4">
            <img
              src={assets.lms_logo1}
              alt="logo"
              className="w-28 h-28 lg:w-32 lg:h-32 rounded-full object-cover border-2 border-[#D4AF37]"
            />
          </div>

          <nav className="flex flex-col sm:flex-row flex-wrap mt-20 justify-start gap-6 text-lg">
            <a href="#" className="hover:text-[#D4AF37] transition-colors duration-200">Home</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors duration-200">Our Services</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors duration-200">About Us</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors duration-200">Contact Us</a>
          </nav>

          <div className="flex space-x-8 mt-6">
            <a href="https://www.instagram.com/divinehubbofficial/?igsh=YWw0M3BwazkwOWZ6" className="p-3 bg-[#A16D00] rounded-md hover:bg-opacity-80 transition-colors duration-200">
              <BsInstagram size={20} />
              {/* <Phone size={20} /> */}
            </a>
            <a href="https://www.facebook.com/people/Shivani/100091967906259/" className="p-3 bg-[#A16D00] rounded-md hover:bg-opacity-80 transition-colors duration-200">
              <FaFacebook size={20} />
              {/* <Mail size={20} /> */}
            </a>
            <a href="https://www.google.com/maps/@28.6485043,77.2486615,12.18z?entry=ttu&g_ep=EgoyMDI1MDcxMy4wIKXMDSoASAFQAw%3D%3D" className="p-3 bg-[#A16D00] rounded-md hover:bg-opacity-80 transition-colors duration-200">
              <MapPin size={20} /> 
            </a>
          </div>
        </div>
        <div className="flex flex-col items-start text-left space-y-6">
          <h3 className="text-xl font-semibold">Contact</h3>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#A16D00] rounded-md flex-shrink-0">
              <Phone size={20} />
            </div>
            <span className="text-lg">+91 9848022338</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#A16D00] rounded-md flex-shrink-0">
              <Mail size={20} />
            </div>
            <span className="text-md lg:text-lg">numerologistshiwaani456@gmail.com</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#A16D00] rounded-md flex-shrink-0">
              <MapPin size={20} />
            </div>
            <p className="text-xl">
              Delhi
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
