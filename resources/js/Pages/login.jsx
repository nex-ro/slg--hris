import React, { useState } from 'react';
import { Eye, EyeOff, Users, UserCheck, Building, ChevronRight } from 'lucide-react';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login" />
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
                <div className="w-full max-w-5xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row min-h-[600px]">
                        {/* Left Side - HRIS Illustration */}
                        <div className="lg:w-3/5 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 p-6 md:p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-10 left-10 w-20 md:w-32 h-1 bg-green-400 transform rotate-12"></div>
                                <div className="absolute top-20 right-20 w-16 md:w-24 h-1 bg-emerald-400 transform -rotate-12"></div>
                                <div className="absolute bottom-32 left-16 w-24 md:w-40 h-1 bg-teal-400 transform rotate-45"></div>
                                <div className="absolute bottom-20 right-12 w-20 md:w-28 h-1 bg-green-400 transform -rotate-45"></div>
                            </div>
                            {/* HRIS Dashboard Scene */}
                            <div className="relative w-full max-w-md lg:max-w-lg">
                                {/* Main Dashboard */}
                                <div className="relative mb-6 md:mb-8">
                                    <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6 transform hover:scale-105 transition-transform duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-2">
                                                <Building className="w-6 md:w-8 h-6 md:h-8 text-green-600" />
                                                <span className="font-bold text-lg md:text-xl text-gray-800">HRIS</span>
                                            </div>
                                            <div className="flex space-x-1 md:space-x-2">
                                                <div className="w-2 md:w-3 h-2 md:h-3 bg-green-500 rounded-full"></div>
                                                <div className="w-2 md:w-3 h-2 md:h-3 bg-emerald-500 rounded-full"></div>
                                                <div className="w-2 md:w-3 h-2 md:h-3 bg-teal-500 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-green-200 rounded"></div>
                                                <div className="h-2 bg-green-200 rounded flex-1"></div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-emerald-200 rounded"></div>
                                                <div className="h-2 bg-emerald-200 rounded w-2/3"></div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-teal-200 rounded"></div>
                                                <div className="h-2 bg-teal-200 rounded w-3/4"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Employee Cards */}
                                <div className="flex justify-between mb-4 md:mb-6 space-x-2 md:space-x-4">
                                    <div className="bg-white rounded-lg shadow-xl p-3 md:p-4 flex-1 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                                        <UserCheck className="w-6 md:w-8 h-6 md:h-8 text-green-600 mx-auto mb-2" />
                                        <div className="text-center">
                                            <div className="h-1 md:h-2 bg-green-300 rounded mb-1"></div>
                                            <div className="h-1 bg-green-200 rounded w-2/3 mx-auto"></div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-xl p-3 md:p-4 flex-1 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                                        <Users className="w-6 md:w-8 h-6 md:h-8 text-emerald-600 mx-auto mb-2" />
                                        <div className="text-center">
                                            <div className="h-1 md:h-2 bg-emerald-300 rounded mb-1"></div>
                                            <div className="h-1 bg-emerald-200 rounded w-3/4 mx-auto"></div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-xl p-3 md:p-4 flex-1 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                                        <Building className="w-6 md:w-8 h-6 md:h-8 text-teal-600 mx-auto mb-2" />
                                        <div className="text-center">
                                            <div className="h-1 md:h-2 bg-teal-300 rounded mb-1"></div>
                                            <div className="h-1 bg-teal-200 rounded w-1/2 mx-auto"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="flex justify-center space-x-2 md:space-x-4">
                                    <div className="bg-white rounded-lg shadow-lg p-3 md:p-4 text-center transform hover:scale-105 transition-transform duration-300">
                                        <div className="text-xl md:text-2xl font-bold text-green-600">150+</div>
                                        <div className="text-xs md:text-sm text-gray-600">Employees</div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-lg p-3 md:p-4 text-center transform hover:scale-105 transition-transform duration-300">
                                        <div className="text-xl md:text-2xl font-bold text-emerald-600">98%</div>
                                        <div className="text-xs md:text-sm text-gray-600">Attendance</div>
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute top-4 right-8 w-2 md:w-3 h-2 md:h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <div className="absolute bottom-12 left-4 w-1 md:w-2 h-1 md:h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                                <div className="absolute top-1/2 right-4 w-3 md:w-4 h-3 md:h-4 bg-teal-400 rounded-full animate-ping"></div>
                            </div>
                        </div>

                        {/* Right Side - Sign In Form */}
                        <div className="lg:w-2/5 p-6 md:p-8 lg:p-12 flex flex-col justify-center">
                            <div className="w-full max-w-sm mx-auto">
                                <div className="text-center mb-6 md:mb-8">
                                    <div className="flex items-center justify-center mb-4">
                                        <div className="bg-green-100 p-3 rounded-full">
                                            <Users className="w-8 h-8 text-green-600" />
                                        </div>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                                        Sign in to your HRIS account<br />
                                        Manage your workforce efficiently
                                    </p>
                                </div>

                                {/* Status Message */}
                                {status && (
                                    <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                        {status}
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-4 md:space-y-6">
                                    {/* Email Field */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
                                            placeholder="Enter your email"
                                            autoComplete="username"
                                            autoFocus
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    {/* Password Field */}
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                name="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 pr-12"
                                                placeholder="Enter your password"
                                                autoComplete="current-password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    {/* Remember Me & Forgot Password */}
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="remember"
                                                name="remember"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                            />
                                            <label htmlFor="remember" className="text-gray-600">
                                                Remember me
                                            </label>
                                        </div>
                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-green-600 hover:text-green-700 transition-colors"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                                    >
                                        <span>{processing ? 'Signing In...' : 'Sign In'}</span>
                                        {!processing && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}