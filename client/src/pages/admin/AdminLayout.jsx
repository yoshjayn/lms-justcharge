import React, { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import SideBar from '../../components/educator/SideBar';
import { AppContext } from '../../context/AppContext';
import { useUser } from '@clerk/clerk-react';

const AdminLayout = () => {
  const { isAdmin } = useContext(AppContext);
  const { user } = useUser();

  // Redirect if not admin
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex">
      <SideBar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;