import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  FileText,
  Users,
  User,
  BarChart3,
  Clock,
  Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation(); 

  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
      { id: 'profile', label: 'My Profile', icon: User, path: '/profile' },
    ];

    if (user?.role === 'employee') {
      return [
        ...baseItems,
        { id: 'apply-leave', label: 'Apply Leave', icon: Calendar, path: '/apply-leave' },
        { id: 'my-requests', label: 'My Requests', icon: FileText, path: '/my-requests' },
      ];
    }

    if (user?.role === 'manager') {
      return [
        ...baseItems,
        { id: 'team-requests', label: 'Team Requests', icon: Users, path: '/team-requests' },
      ];
    }

    if (user?.role === 'hr' || user?.role === 'admin') {
      return [
        ...baseItems,
        { id: 'create-employee', label: 'Create Employee', icon: FileText, path: '/create-employee' },
        { id: 'all-requests', label: 'All Requests', icon: Clock, path: '/all-requests' },
        { id: 'employees', label: 'Employees', icon: Users, path: '/employees' },
        { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 w-64 h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h2>
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;