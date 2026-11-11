// resources/js/Pages/Atasan/DashboardHead.jsx

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Users, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { Head } from '@inertiajs/react';

const DashboardHead = ({ 
  filters, 
  users, 
  userInfo,
  top10PerTower, 
  monthlyTable, 
  lateTrendData, 
  late3TimesData, 
  summaryStats 
}) => {
  const currentDate = new Date();
  const [localFilters, setLocalFilters] = useState({
    periodType: filters?.periodType || 'month',
    month: filters?.month || currentDate.getMonth() + 1,
    year: filters?.year || currentDate.getFullYear(),
    userId: filters?.userId || ''
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    
    const params = new URLSearchParams();
    if (newFilters.periodType) params.append('periodType', newFilters.periodType);
    if (newFilters.month) params.append('month', newFilters.month);
    if (newFilters.year) params.append('year', newFilters.year);
    if (newFilters.userId) params.append('userId', newFilters.userId);
    
    window.location.href = `?${params.toString()}`;
  };

  const getCellColor = (value) => {
    if (value === 0) return 'bg-green-500';
    if (value === 1) return 'bg-yellow-400';
    if (value === 2) return 'bg-orange-400';
    return 'bg-red-500';
  };

  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
      <AlertTriangle className="w-10 h-10 mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  );

  const hasData = summaryStats?.totalLate > 0;

  return (
    <LayoutTemplate>
      <Head title="Dashboard Divisi" />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Info Divisi */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Dashboard Divisi {userInfo?.divisi || '-'}</h1>
                <p className="text-blue-100">Tower: {userInfo?.tower || '-'} • Atasan: {userInfo?.name}</p>
              </div>
            </div>
          </div>

          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">Total Keterlambatan</h3>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-blue-600">
                  {summaryStats?.totalLate || 0}
                </span>
                <span className="text-gray-500 mb-1">Kejadian</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">Karyawan Terlambat</h3>
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-green-600">
                  {summaryStats?.uniqueEmployees || 0}
                </span>
                <span className="text-gray-500 mb-1">Orang</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">Terlambat ≥3 Kali</h3>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-red-600">
                  {late3TimesData || 0}
                </span>
                <span className="text-gray-500 mb-1">Karyawan</span>
              </div>
            </div>
          </div>

          {/* Filters - Simplified */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Filter Data
            </h2>
            
            {/* Period Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Periode</label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleFilterChange('periodType', 'month')}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                    localFilters.periodType === 'month'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Per Bulan
                </button>
                <button
                  onClick={() => handleFilterChange('periodType', 'period')}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                    localFilters.periodType === 'period'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Per Periode (Tahunan)
                </button>
              </div>
            </div>

            {/* Date & User Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
                <select
                  value={localFilters.month || ''}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={localFilters.periodType === 'period'}
                >
                  {monthNames.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                <select
                  value={localFilters.year || ''}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2023, 2024, 2025].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Anggota Tim
                </label>
                <select
                  value={localFilters.userId || ''}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Anggota</option>
                  {users && users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filter Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Periode:</strong> {localFilters.periodType === 'month' 
                  ? `${monthNames[localFilters.month - 1]} ${localFilters.year}` 
                  : `Tahun ${localFilters.year}`}
                <span className="text-blue-600 font-medium"> • Divisi: {userInfo?.divisi}</span>
              </p>
            </div>
          </div>

          {/* No Data Warning */}
          {!hasData && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Tidak Ada Keterlambatan</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Selamat! Tidak ada data keterlambatan untuk divisi Anda pada periode ini.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Tren Keterlambatan {localFilters.periodType === 'month' ? 'Harian' : 'Bulanan'}
            </h2>
            {lateTrendData && lateTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={lateTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    dot={{ fill: '#2563eb', r: 4 }} 
                    name="Jumlah Terlambat"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Tidak ada data tren keterlambatan" />
            )}
          </div>

          {/* Top 10 Karyawan Terlambat */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Anggota Tim Paling Sering Terlambat
            </h2>
            {top10PerTower && top10PerTower.length > 0 ? (
              <div className="space-y-3">
                {top10PerTower.slice(0, 10).map((item, idx) => {
                  const maxCount = Math.max(...top10PerTower.map(i => i.count));
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0 ${
                        idx === 0 ? 'bg-red-500 text-white' :
                        idx === 1 ? 'bg-orange-400 text-white' :
                        idx === 2 ? 'bg-yellow-400 text-yellow-900' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-gray-800 w-48 truncate text-sm font-medium" title={item.name}>
                        {item.name}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                        <div
                          className={`h-full rounded-full flex items-center justify-end pr-3 transition-all duration-300 ${
                            idx === 0 ? 'bg-red-500' :
                            idx === 1 ? 'bg-orange-400' :
                            idx === 2 ? 'bg-yellow-400' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${Math.max((item.count / maxCount) * 100, 15)}%` }}
                        >
                          <span className="text-white font-bold text-xs">{item.count}x</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="Tidak ada data karyawan terlambat" />
            )}
          </div>

          {/* Monthly/Daily Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Detail Keterlambatan {localFilters.periodType === 'month' 
                ? `- ${monthNames[localFilters.month - 1]} ${localFilters.year}` 
                : `- Tahun ${localFilters.year}`}
            </h2>
            {monthlyTable && monthlyTable.length > 0 ? (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="text-gray-700 border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left p-2 sticky left-0 bg-gray-50 z-20 font-semibold">Nama</th>
                      {localFilters.periodType === 'month' ? (
                        Array.from({ length: new Date(localFilters.year, localFilters.month, 0).getDate() }, (_, i) => i + 1).map(day => (
                          <th key={day} className="p-2 min-w-[32px] font-semibold">{day}</th>
                        ))
                      ) : (
                        monthNames.map(month => (
                          <th key={month} className="p-2 min-w-[36px] font-semibold">{month}</th>
                        ))
                      )}
                      <th className="p-2 min-w-[50px] font-bold bg-blue-50">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyTable.map((row, idx) => {
                      const total = localFilters.periodType === 'month'
                        ? Array.from({ length: new Date(localFilters.year, localFilters.month, 0).getDate() }, (_, i) => i + 1)
                            .reduce((sum, day) => sum + (parseInt(row[`day${day}`]) || 0), 0)
                        : monthNames.reduce((sum, month) => sum + (parseInt(row[month.toLowerCase()]) || 0), 0);
                      
                      return (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="text-gray-800 p-2 text-xs font-medium sticky left-0 bg-white hover:bg-blue-50 z-10">
                            {row.name}
                          </td>
                          {localFilters.periodType === 'month' ? (
                            Array.from({ length: new Date(localFilters.year, localFilters.month, 0).getDate() }, (_, i) => i + 1).map(day => {
                              const value = row[`day${day}`] || 0;
                              return (
                                <td key={day} className="p-1 text-center">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${getCellColor(value)} text-white font-semibold text-xs`}>
                                    {value}
                                  </span>
                                </td>
                              );
                            })
                          ) : (
                            monthNames.map(month => {
                              const value = row[month.toLowerCase()] || 0;
                              return (
                                <td key={month} className="p-1 text-center">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${getCellColor(value)} text-white font-semibold text-xs`}>
                                    {value}
                                  </span>
                                </td>
                              );
                            })
                          )}
                          <td className="text-gray-900 p-2 text-center font-bold bg-blue-50">
                            {total}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="Tidak ada data keterlambatan" />
            )}
          </div>

        </div>
      </div>
    </LayoutTemplate>
  );
};

export default DashboardHead;