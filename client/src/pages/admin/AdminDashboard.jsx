import React, { useState, useEffect } from 'react';
import { assets } from '../../assets/assets';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    pendingEnrollments: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard-stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <img src={assets.patients_icon} alt="" className="w-8 h-8 mr-3" />
            <div>
              <p className="text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <img src={assets.my_course_icon} alt="" className="w-8 h-8 mr-3" />
            <div>
              <p className="text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <img src={assets.appointments_icon} alt="" className="w-8 h-8 mr-3" />
            <div>
              <p className="text-gray-600">Pending Enrollments</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingEnrollments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <img src={assets.earning_icon} alt="" className="w-8 h-8 mr-3" />
            <div>
              <p className="text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/pending-enrollments"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold">Review Enrollments</h3>
            <p className="text-gray-600 text-sm">Process pending enrollment requests</p>
          </a>
          
          <a
            href="/admin/courses"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold">Manage Courses</h3>
            <p className="text-gray-600 text-sm">View and manage all courses</p>
          </a>
          
          <a
            href="/admin/users"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold">User Management</h3>
            <p className="text-gray-600 text-sm">View and manage user accounts</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
