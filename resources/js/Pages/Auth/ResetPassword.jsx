import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Shield, ChevronRight, Calendar, UserCheck, TrendingUp, CheckCircle } from 'lucide-react';
import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Reset Password - My-SLG" />
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
                        {/* Unified Container - Desktop */}
                        <div className="hidden lg:flex bg-white rounded-3xl shadow-2xl overflow-hidden">
                            {/* Left Side - Feature Highlights */}
                            <div className="w-1/2 p-10 xl:p-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                                {/* Logo & Brand Header */}
                                <div className="mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="">
                                            <img 
                                                src="/asset/logo.png" 
                                                alt="My-SLG Logo" 
                                                className="w-20 h-20 object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextElementSibling.classList.remove('hidden');
                                                }}
                                            />
                                            <div className="w-20 h-20 hidden flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white text-3xl font-bold shadow-lg">
                                                SLG
                                            </div>
                                        </div>
                                        <div>
                                            <h1 className="text-4xl font-bold text-gray-900">My SLG</h1>
                                            <p className="text-gray-600 text-sm">Human Resource Information System</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <p className="text-gray-700 text-lg xl:text-xl font-medium leading-relaxed">
                                        Platform terpadu untuk mengelola kehadiran, cuti, dan administrasi karyawan secara efisien
                                    </p>
                                </div>

                                {/* Feature Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-xl p-5 shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                                            <Calendar className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-gray-900 font-semibold mb-1 text-base">Manajemen Cuti</h3>
                                        <p className="text-gray-600 text-sm">Pengajuan dan approval cuti online</p>
                                    </div>

                                    <div className="bg-white rounded-xl p-5 shadow-md border border-indigo-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                                            <UserCheck className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-gray-900 font-semibold mb-1 text-base">Kehadiran</h3>
                                        <p className="text-gray-600 text-sm">Monitoring kehadiran real-time</p>
                                    </div>

                                    <div className="bg-white rounded-xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                                            <TrendingUp className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-gray-900 font-semibold mb-1 text-base">Dashboard Analytics</h3>
                                        <p className="text-gray-600 text-sm">Laporan dan statistik lengkap</p>
                                    </div>

                                    <div className="bg-white rounded-xl p-5 shadow-md border border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                        <div className="bg-gradient-to-br from-pink-500 to-pink-600 w-12 h-12 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                                            <Shield className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-gray-900 font-semibold mb-1 text-base">Keamanan Data</h3>
                                        <p className="text-gray-600 text-sm">Sistem terenkripsi dan aman</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Reset Password Form */}
                            <div className="w-1/2 p-10 xl:p-12 flex flex-col justify-center">
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                                        <Lock className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                                    <p className="text-gray-600 text-base">
                                        Masukkan password baru untuk akun Anda
                                    </p>
                                </div>

                                <form onSubmit={submit} className="space-y-4">
                                    {/* Email Field (Read-only) */}
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
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                                            autoComplete="username"
                                            readOnly
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    {/* Password Field */}
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Password Baru
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                name="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 pr-12 text-gray-900 placeholder-gray-400"
                                                placeholder="Masukkan password baru"
                                                autoComplete="new-password"
                                                autoFocus
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    {/* Password Confirmation Field */}
                                    <div>
                                        <label htmlFor="password_confirmation" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Konfirmasi Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswordConfirmation ? 'text' : 'password'}
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 pr-12 text-gray-900 placeholder-gray-400"
                                                placeholder="Konfirmasi password baru"
                                                autoComplete="new-password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                            >
                                                {showPasswordConfirmation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                    </div>

                                    {/* Password Requirements Info */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                        <p className="text-xs text-blue-800 font-medium mb-2 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Syarat Password:
                                        </p>
                                        <ul className="text-xs text-blue-700 space-y-1 ml-6 list-disc">
                                            <li>Minimal 8 karakter</li>
                                            <li>Kombinasi huruf dan angka</li>
                                            <li>Password harus sama dengan konfirmasi</li>
                                        </ul>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        <span>{processing ? 'Memproses...' : 'Reset Password'}</span>
                                        {!processing && <ChevronRight className="w-5 h-5" />}
                                    </button>
                                </form>

                                {/* Footer */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-center text-sm text-gray-500">
                                        Sistem informasi manajemen SDM terintegrasi
                                    </p>
                                    <p className="text-center text-xs text-gray-400 mt-2">
                                        © 2025 my-slg. All rights reserved.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="lg:hidden flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
                            {/* Logo & Brand Header - Mobile */}
                            <div className="mb-6 text-center px-4">
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <div className="bg-white bg-opacity-20 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-white border-opacity-30">
                                        <img 
                                            src="/asset/logo.png" 
                                            alt="My-SLG Logo" 
                                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.classList.remove('hidden');
                                            }}
                                        />
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white text-lg sm:text-xl font-bold">
                                            SLG
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">My SLG</h1>
                                        <p className="text-blue-100 text-xs drop-shadow">Human Resource System</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reset Password Form - Mobile */}
                            <div className="w-full max-w-md">
                                <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 w-full">
                                    {/* Header */}
                                    <div className="text-center mb-5 sm:mb-6">
                                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-3 sm:mb-4 shadow-lg">
                                            <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">Reset Password</h2>
                                        <p className="text-gray-600 text-xs sm:text-sm">
                                            Masukkan password baru untuk akun Anda
                                        </p>
                                    </div>

                                    <form onSubmit={submit} className="space-y-3.5 sm:space-y-4">
                                        {/* Email Field (Read-only) */}
                                        <div>
                                            <label htmlFor="email-mobile" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="email-mobile"
                                                name="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
                                                autoComplete="username"
                                                readOnly
                                            />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>

                                        {/* Password Field */}
                                        <div>
                                            <label htmlFor="password-mobile" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Password Baru
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="password-mobile"
                                                    name="password"
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 pr-12 text-gray-900 placeholder-gray-400 text-sm"
                                                    placeholder="Masukkan password baru"
                                                    autoComplete="new-password"
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

                                        {/* Password Confirmation Field */}
                                        <div>
                                            <label htmlFor="password_confirmation-mobile" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Konfirmasi Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswordConfirmation ? 'text' : 'password'}
                                                    id="password_confirmation-mobile"
                                                    name="password_confirmation"
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 pr-12 text-gray-900 placeholder-gray-400 text-sm"
                                                    placeholder="Konfirmasi password baru"
                                                    autoComplete="new-password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                                >
                                                    {showPasswordConfirmation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password_confirmation} className="mt-2" />
                                        </div>

                                        {/* Password Requirements Info */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 sm:p-3">
                                            <p className="text-xs text-blue-800 font-medium mb-1.5 sm:mb-2 flex items-center gap-2">
                                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                Syarat Password:
                                            </p>
                                            <ul className="text-xs text-blue-700 space-y-1 ml-5 sm:ml-6 list-disc">
                                                <li>Minimal 8 karakter</li>
                                                <li>Kombinasi huruf dan angka</li>
                                                <li>Password harus sama dengan konfirmasi</li>
                                            </ul>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm"
                                        >
                                            <span>{processing ? 'Memproses...' : 'Reset Password'}</span>
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