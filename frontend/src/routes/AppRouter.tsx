import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import ApplyLeavePage from '../pages/ApplyLeavePage';
import MyRequestsPage from '../pages/MyRequestsPage';
import TeamRequestsPage from '../pages/TeamRequestsPage';
import AllRequestsPage from '../pages/AllRequestsPage';
import EmployeesPage from '../pages/EmployeesPage';
import ReportsPage from '../pages/ReportsPage';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CreateEmployeePage from '../pages/CreateEmployeePage';

const AppRouter: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const getRoutes = () => {
    const baseRoutes = [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ];

    if (user?.role === 'employee') {
      return [
        ...baseRoutes,
        { path: '/apply-leave', element: <ApplyLeavePage /> },
        { path: '/my-requests', element: <MyRequestsPage /> },
      ];
    }

    if (user?.role === 'manager') {
      return [
        ...baseRoutes,
        { path: '/team-requests', element: <TeamRequestsPage /> },
      ];
    }

    if (user?.role === 'hr' || user?.role === 'admin') {
      return [
        ...baseRoutes,
        { path: '/create-employee', element: <CreateEmployeePage /> },
        { path: '/my-requests', element: <MyRequestsPage /> },
        { path: '/all-requests', element: <AllRequestsPage /> },
        { path: '/employees', element: <EmployeesPage /> },
        { path: '/reports', element: <ReportsPage /> },
      ];
    }

    return baseRoutes;
  };

  const routes = getRoutes();

  return (
    <Router>
      <Layout>
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default AppRouter;