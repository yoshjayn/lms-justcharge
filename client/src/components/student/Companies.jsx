import React from 'react';
import { assets } from '../../assets/assets';

const Companies = () => {
  return (
    <div className="min-h-screen bg-[#F9ECE2] relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute top-20 left-20 text-amber-400 text-2xl">✦</div>
      <div className="absolute top-40 right-32 text-orange-400 text-lg">✦</div>
      <div className="absolute bottom-40 left-16 text-pink-400 text-xl">✦</div>
      <div className="absolute top-60 left-1/3 text-amber-300 text-sm">✦</div>
      <div className="absolute bottom-60 right-20 text-orange-300 text-base">✦</div>
      
      <div className="container mx-auto px-6 py-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Left Content */}
        <div className="flex-1 space-y-8">
          <div>
            <p className="text-amber-700 text-sm font-medium tracking-wider uppercase mb-4">
              Meet Your Mentor
            </p>
            <h1 className="text-4xl lg:text-5xl font-serif text-amber-900 mb-6">
              Hello, I'm<br />
              <span className="text-5xl lg:text-6xl">Mrs. Shivani Gupta</span>
            </h1>
            <p className="text-amber-800 leading-relaxed text-lg max-w-md">
              Dedicated to guiding students through their learning journey with expertise, 
              compassion, and innovative teaching methods. Together, we'll unlock your potential 
              and achieve academic excellence.
            </p>
          </div>

          {/* Certifications Section */}
          {/* <div className="space-y-4">
            <h3 className="text-2xl font-serif text-amber-900 mb-4">
              Certifications & Accreditations
            </h3>
            <div className="border-2 border-amber-200 rounded-lg p-6 bg-white/50 backdrop-blur-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  <span className="text-amber-800">Educational Leadership Certification - Delhi University</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  <span className="text-amber-800">Advanced Teaching Methodology - NCERT</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  <span className="text-amber-800">Student Psychology & Counseling - IGNOU</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  <span className="text-amber-800">Digital Learning Specialist (Level 2)</span>
                </div>
              </div>
            </div>
          </div> */}

          {/* Decorative accent */}
          <div className="absolute left-8 top-1/3 transform -translate-y-1/2">
            <div className="w-12 h-12 text-amber-400 text-4xl">✦</div>
          </div>
        </div>

        {/* Right Content - Photo */}
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative">
            {/* Decorative border */}
            <div className="w-80 h-96 lg:w-96 lg:h-[500px] rounded-t-full border-4 border-amber-300 overflow-hidden relative">
              {/* Mentor photo */}
              <img 
                className="absolute inset-4 rounded-t-full w-full h-full object-cover object-center"
                src={assets.mentor_photo} 
                alt="Mrs. Shivani Gupta - Mentor" 
              />
              {/* Optional overlay for better text readability */}
              <div className="absolute bottom-0 left-4 right-4 bg-gradient-to-t from-black/20 to-transparent rounded-b-full h-20"></div>
            </div>
            
            {/* Decorative line */}
            <div className="absolute top-20 -left-8 w-16 h-px bg-amber-400"></div>
            <div className="absolute top-20 -left-4 w-2 h-2 bg-amber-400 rounded-full"></div>
            
            {/* Small decorative stars around photo */}
            <div className="absolute -top-4 right-8 text-amber-400 text-lg">✦</div>
            <div className="absolute top-32 -right-6 text-orange-400 text-sm">✦</div>
            <div className="absolute bottom-20 -left-8 text-pink-400 text-base">✦</div>
          </div>
        </div>
      </div>

      {/* Bottom decorative accent */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-8 h-8 text-amber-400 text-2xl">✦</div>
      </div>
    </div>
  );
};

export default Companies;