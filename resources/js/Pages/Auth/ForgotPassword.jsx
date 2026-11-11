import React from 'react';
import { Mail, Shield, ChevronRight, ArrowLeft, Calendar, UserCheck, TrendingUp } from 'lucide-react';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Lupa Password - My-SLG" />
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

                            {/* Right Side - Forgot Password Form */}
                            <div className="w-1/2 p-10 xl:p-12 flex flex-col justify-center">
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                                        <Mail className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Lupa Password?</h2>
                                    <p className="text-gray-600 text-base">
                                        Tidak masalah. Masukkan email Anda dan kami akan mengirimkan link reset password
                                    </p>
                                </div>

                                {/* Status Message */}
                                {status && (
                                    <div className="mb-6 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                        {status}
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-5">
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
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                                            placeholder="nama@email.com"
                                            autoComplete="username"
                                            autoFocus
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        <span>{processing ? 'Mengirim...' : 'Kirim Link Reset Password'}</span>
                                        {!processing && <ChevronRight className="w-5 h-5" />}
                                    </button>

                                    {/* Back to Login */}
                                    <div className="text-center">
                                        <Link
                                            href={route('login')}
                                            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Kembali ke halaman login
                                        </Link>
                                    </div>
                                </form>

                                {/* Footer */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
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

                            {/* Forgot Password Form - Mobile */}
                            <div className="w-full max-w-md">
                                <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 w-full">
                                    {/* Header */}
                                    <div className="text-center mb-5 sm:mb-6">
                                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-3 sm:mb-4 shadow-lg">
                                            <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">Lupa Password?</h2>
                                        <p className="text-gray-600 text-xs sm:text-sm">
                                            Masukkan email Anda untuk mendapatkan link reset password
                                        </p>
                                    </div>

                                    {/* Status Message */}
                                    {status && (
                                        <div className="mb-5 sm:mb-6 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                            {status}
                                        </div>
                                    )}

                                    <form onSubmit={submit} className="space-y-4 sm:space-y-5">
                                        {/* Email Field */}
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
                                                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
                                                placeholder="nama@email.com"
                                                autoComplete="username"
                                                required
                                            />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm"
                                        >
                                            <span>{processing ? 'Mengirim...' : 'Kirim Link Reset'}</span>
                                            {!processing && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                                        </button>

                                        {/* Back to Login */}
                                        <div className="text-center">
                                            <Link
                                                href={route('login')}
                                                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                            >
                                                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                Kembali ke halaman login
                                            </Link>
                                        </div>
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