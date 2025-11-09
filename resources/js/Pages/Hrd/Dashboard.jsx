import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Users, AlertTriangle, TrendingUp, Building2, Briefcase } from 'lucide-react';
import DashboardLayouts from '@/Layouts/DasboardLayout';
import { Head } from '@inertiajs/react';

const Dashboard = ({ 
  filters, 
  towers, 
  divisions, 
  users, 
  top10PerTower, 
  lateByDivision, 
  monthlyTable, 
  lateTrendData, 
  pieChartData, 
  late3TimesData, 
  summaryStats 
}) => {
  const currentDate = new Date();
  const [localFilters, setLocalFilters] = useState({
    periodType: filters?.periodType || 'month',
    month: filters?.month || currentDate.getMonth() + 1,
    year: filters?.year || currentDate.getFullYear(),
    tower: filters?.tower || '',
    divisi: filters?.divisi || '',
    userId: filters?.userId || ''
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1e40af', '#1d4ed8'];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    
    const params = new URLSearchParams();
    if (newFilters.periodType) params.append('periodType', newFilters.periodType);
    if (newFilters.month) params.append('month', newFilters.month);
    if (newFilters.year) params.append('year', newFilters.year);
    if (newFilters.tower) params.append('tower', newFilters.tower);
    if (newFilters.divisi) params.append('divisi', newFilters.divisi);
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
    <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
      <AlertTriangle className="w-12 h-12 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );

  const hasData = summaryStats?.totalLate > 0;

  return (
    <DashboardLayouts>
      <Head  title="Dashboard" />
      <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* tesss */}
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
              <h3 className="text-sm font-medium text-gray-600">Karyawan Unik Terlambat</h3>
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

        {/* Filters - Redesigned */}
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
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Per Bulan
              </button>
              <button
                onClick={() => handleFilterChange('periodType', 'period')}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  localFilters.periodType === 'period'
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Per Periode (Tahunan)
              </button>
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bulan {localFilters.periodType === 'period' && <span className="text-gray-400">(Tidak aktif untuk periode tahunan)</span>}
              </label>
              <select
                value={localFilters.month || ''}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={localFilters.periodType === 'period'}
              >
                {monthNames.map((month, idx) => (
                  <option key={idx} value={idx + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
              <select
                value={localFilters.year || ''}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Tower
              </label>
              <select
                value={localFilters.tower || ''}
                onChange={(e) => handleFilterChange('tower', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Tower</option>
                {towers && towers.map(tower => (
                  <option key={tower} value={tower}>
                    {tower}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Divisi
              </label>
              <select
                value={localFilters.divisi || ''}
                onChange={(e) => handleFilterChange('divisi', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Divisi</option>
                {divisions && divisions.map(div => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Karyawan
              </label>
              <select
                value={localFilters.userId || ''}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Karyawan</option>
                {users && users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
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
              {localFilters.tower && ` • Tower: ${localFilters.tower}`}
              {localFilters.divisi && ` • Divisi: ${localFilters.divisi}`}
              {localFilters.userId && ` • Karyawan dipilih`}
            </p>
          </div>
        </div>

        {/* No Data Warning */}
        {!hasData && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Tidak Ada Data Keterlambatan</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Tidak ditemukan data keterlambatan untuk periode dan filter yang dipilih. Silakan ubah filter untuk melihat data lainnya.
                </p>
              </div>
            </div>
          </div>
        )}

     

        {/* Trend Chart - Full Width */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Tren Keterlambatan {localFilters.periodType === 'month' ? 'Harian' : 'Bulanan'}
          </h2>
          {lateTrendData && lateTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={lateTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={{ fill: '#2563eb', r: 4 }} 
                  activeDot={{ r: 6 }}
                  name="Jumlah Terlambat"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Tidak ada data tren keterlambatan untuk periode ini" />
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Top 10 Karyawan Terlambat
            </h2>
            {top10PerTower && top10PerTower.length > 0 ? (
              <div className="space-y-3">
                {top10PerTower.map((item, idx) => {
                  const maxCount = Math.max(...top10PerTower.map(i => i.count));
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs flex-shrink-0 ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-300 text-orange-900' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-gray-800 w-40 truncate text-sm font-medium flex-shrink-0" title={item.name}>
                        {item.name}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-300 shadow-sm"
                          style={{ width: `${(item.count / maxCount) * 100}%`, minWidth: '32px' }}
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

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Top 5 Distribusi Keterlambatan
            </h2>
            {pieChartData && pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Tidak ada data distribusi keterlambatan" />
            )}
          </div>
        </div>

        {/* Division Bar Chart - Full Width */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Keterlambatan Per Divisi
          </h2>
          {lateByDivision && lateByDivision.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={lateByDivision}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} 
                />
                <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} name="Jumlah Terlambat" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Tidak ada data keterlambatan per divisi" />
          )}
        </div>

        {/* Monthly Table */}
        {/* Monthly Table */}
<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
    <Calendar className="w-5 h-5 text-blue-600" />
    {localFilters.periodType === 'month' 
      ? `Keterlambatan Harian - ${monthNames[localFilters.month - 1]} ${localFilters.year}` 
      : `Keterlambatan Bulanan ${localFilters.year}`}
    {localFilters.divisi && ` - ${localFilters.divisi}`}
  </h2>
  {monthlyTable && monthlyTable.length > 0 ? (
    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10">
          <tr className="text-gray-700 border-b-2 border-gray-200 bg-gray-50">
            <th className="text-left p-2 sticky left-0 bg-gray-50 z-20 font-semibold">Nama</th>
            {localFilters.periodType === 'month' ? (
              // Tampilkan kolom hari (1-31)
              Array.from({ length: new Date(localFilters.year, localFilters.month, 0).getDate() }, (_, i) => i + 1).map(day => (
                <th key={day} className="p-2 min-w-[36px] font-semibold">{day}</th>
              ))
            ) : (
              // Tampilkan kolom bulan (Jan-Dec)
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
                  // Tampilkan nilai per hari
                  Array.from({ length: new Date(localFilters.year, localFilters.month, 0).getDate() }, (_, i) => i + 1).map(day => {
                    const value = row[`day${day}`] || 0;
                    return (
                      <td key={day} className="p-2 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded ${getCellColor(value)} text-white font-semibold text-xs shadow-sm`}>
                          {value}
                        </span>
                      </td>
                    );
                  })
                ) : (
                  // Tampilkan nilai per bulan
                  monthNames.map(month => {
                    const value = row[month.toLowerCase()] || 0;
                    return (
                      <td key={month} className="p-2 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded ${getCellColor(value)} text-white font-semibold text-xs shadow-sm`}>
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
    <EmptyState message={`Tidak ada data keterlambatan ${localFilters.periodType === 'month' ? 'harian' : 'bulanan'}`} />
  )}
</div>
      </div>
    </div>
    </DashboardLayouts>
  );
};

export default Dashboard;