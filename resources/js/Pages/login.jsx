import React, { useState } from 'react';
import { Eye, EyeOff, Users, UserCheck, ChevronRight, Calendar, TrendingUp, Shield } from 'lucide-react';
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
            <Head title="Login - My-SLG" />
            <div 
                className="min-h-screen overflow-auto bg-cover bg-center bg-no-repeat relative flex items-center justify-center"
                style={{
                    backgroundImage: "url('/asset/loginBg.jpg')",
                }}
            >
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-900/60 to-purple-900/70 backdrop-blur-sm"></div>
                
                <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    <div className="w-full max-w-6xl my-auto">
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-center min-h-[calc(100vh-2rem)] lg:min-h-0">
                            {/* Left Side - Feature Highlights (Hidden on Mobile) */}
                            <div className="hidden lg:flex lg:w-1/2 flex-col gap-6">
                                {/* Logo & Brand Header - Desktop Only */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white bg-opacity-20 backdrop-blur-md p-4 rounded-2xl border border-white border-opacity-30">
                                            <img 
                                                src="/asset/logo.png" 
                                                alt="My-SLG Logo" 
                                                className="w-12 h-12 object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextElementSibling.classList.remove('hidden');
                                                }}
                                            />
                                            <div className="w-12 h-12 hidden flex items-center justify-center text-white text-2xl font-bold">
                                                SLG
                                            </div>
                                        </div>
                                        <div>
                                            <h1 className="text-4xl font-bold text-white drop-shadow-lg">My SLG</h1>
                                            <p className="text-blue-100 text-sm drop-shadow">Human Resource Information System</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-blue-100 text-lg xl:text-xl max-w-md drop-shadow">
                                        Platform terpadu untuk mengelola kehadiran, cuti, dan administrasi karyawan secara efisien
                                    </p>
                                </div>

                                {/* Feature Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-5 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                                        <div className="bg-blue-400 bg-opacity-30 w-14 h-14 rounded-lg flex items-center justify-center mb-3">
                                            <Calendar className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-white font-semibold mb-1 text-lg">Manajemen Cuti</h3>
                                        <p className="text-blue-100 text-sm">Pengajuan dan approval cuti online</p>
                                    </div>
                                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-5 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                                        <div className="bg-indigo-400 bg-opacity-30 w-14 h-14 rounded-lg flex items-center justify-center mb-3">
                                            <UserCheck className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-white font-semibold mb-1 text-lg">Kehadiran</h3>
                                        <p className="text-blue-100 text-sm">Monitoring kehadiran real-time</p>
                                    </div>
                                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-5 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                                        <div className="bg-purple-400 bg-opacity-30 w-14 h-14 rounded-lg flex items-center justify-center mb-3">
                                            <TrendingUp className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-white font-semibold mb-1 text-lg">Dashboard Analytics</h3>
                                        <p className="text-blue-100 text-sm">Laporan dan statistik lengkap</p>
                                    </div>
                                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-5 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                                        <div className="bg-pink-400 bg-opacity-30 w-14 h-14 rounded-lg flex items-center justify-center mb-3">
                                            <Shield className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-white font-semibold mb-1 text-lg">Keamanan Data</h3>
                                        <p className="text-blue-100 text-sm">Sistem terenkripsi dan aman</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Login Form */}
                            <div className="w-full lg:w-1/2 max-w-md">
                                {/* Logo & Brand Header - Mobile Only */}
                                <div className="lg:hidden mb-6 text-center px-4">
                                    <div className="flex items-center justify-center gap-3 mb-3">
                                        <div className="bg-white bg-opacity-20 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-white border-opacity-30">
                                            <img 
                                                src="/asset/logo.png" 
                                                alt="My-SLG Logo" 
                                                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextElementSibling.classList.remove('hidden');
                                                }}
                                            />
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 hidden flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                                                SLG
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">My SLG</h1>
                                            <p className="text-blue-100 text-xs drop-shadow">Human Resource System</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl lg:rounded-3xl shadow-2xl p-5 sm:p-6 lg:p-8 w-full">
                                    {/* Header */}
                                    <div className="text-center mb-5 sm:mb-6">
                                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-3 sm:mb-4 shadow-lg">
                                            <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                                        </div>
                                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Selamat Datang</h2>
                                        <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
                                            Masuk ke akun my-slg Anda
                                        </p>
                                    </div>

                                    {/* Status Message */}
                                    {status && (
                                        <div className="mb-5 sm:mb-6 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                            {status}
                                        </div>
                                    )}

                                    <form onSubmit={submit} className="space-y-3.5 sm:space-y-4">
                                        {/* Email Field */}
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm lg:text-base"
                                                placeholder="nama@email.com"
                                                autoComplete="username"
                                                autoFocus
                                                required
                                            />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>

                                        {/* Password Field */}
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="password"
                                                    name="password"
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 pr-12 text-gray-900 placeholder-gray-400 text-sm lg:text-base"
                                                    placeholder="Masukkan password Anda"
                                                    autoComplete="current-password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password} className="mt-2" />
                                        </div>

                                        {/* Remember Me & Forgot Password */}
                                        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 text-xs sm:text-sm">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    id="remember"
                                                    name="remember"
                                                    checked={data.remember}
                                                    onChange={(e) => setData('remember', e.target.checked)}
                                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                />
                                                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                                                    Ingat saya
                                                </span>
                                            </label>
                                            {canResetPassword && (
                                                <Link
                                                    href={route('password.request')}
                                                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                                >
                                                    Lupa password?
                                                </Link>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm lg:text-base"
                                        >
                                            <span>{processing ? 'Memproses...' : 'Masuk'}</span>
                                            {!processing && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                                        </button>
                                    </form>

                                    {/* Footer */}
                                    <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-200">
                                        <p className="text-center text-xs sm:text-sm text-gray-500">
                                            Sistem informasi manajemen SDM terintegrasi
                                        </p>
                                        <p className="text-center text-xs text-gray-400 mt-1.5 sm:mt-2">
                                            © 2025 my-slg. All rights reserved.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}