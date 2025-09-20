import React from 'react';
import {
    User,
    Mail,
    Calendar,
    Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Profile: React.FC = () => {
    const { user } = useAuth();
    console.log(user);

    const getRoleDisplay = (role: string) => {
        switch (role) {
            case 'employee':
                return 'Employee';
            case 'manager':
                return 'Manager';
            case 'hr':
                return 'HR Manager';
            case 'admin':
                return 'System Administrator';
            default:
                return role;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'employee':
                return 'bg-blue-100 text-blue-800';
            case 'manager':
                return 'bg-green-100 text-green-800';
            case 'hr':
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (!user) return null;

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <div className="mb-4">
                                <div className="mx-auto h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <User className="h-12 w-12 text-indigo-600" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{user.name}</h3>
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                                    user.role
                                )}`}
                            >
                                <Shield className="h-4 w-4 mr-1" />
                                {getRoleDisplay(user.role)}
                            </span>
                        </div>

                        {/* Leave Balance Summary */}
                        <div className="bg-white rounded-lg shadow p-6 mt-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Annual Leave</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {user.leaveBalances?.annual ?? 0} days
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Sick Leave</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {user.leaveBalances?.sick ?? 0} days
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User className="h-4 w-4 inline mr-2" />
                                        Full Name
                                    </label>
                                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                        {user.name}
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="h-4 w-4 inline mr-2" />
                                        Email Address
                                    </label>
                                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Employee ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="h-4 w-4 inline mr-2" />
                                        Employee ID
                                    </label>
                                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                        EMP-{user._id.slice(-6).toUpperCase()}
                                    </p>
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Shield className="h-4 w-4 inline mr-2" />
                                        Role
                                    </label>
                                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                        {getRoleDisplay(user.role)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;