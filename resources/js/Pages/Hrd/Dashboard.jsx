import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';
import { Calendar, Users, Building2, TrendingUp, AlertCircle, Clock, Download, Filter, X, ChevronDown, Award, TrendingDown, Activity, UserCheck, MapPin, Briefcase } from 'lucide-react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
function Dashboard({ 
  filters,
  towers,
  divisions,
  users,
  top10PerTower,
  lateByDivision,
  lateTrendData,
  late3TimesData,
  summaryStats 
}) {
  const [selectedTower, setSelectedTower] = useState(filters.tower || towers[0] || '');
  const [selectedDivision, setSelectedDivision] = useState(filters.divisi || 'All');
  const [selectedPerson, setSelectedPerson] = useState(filters.userId ? String(filters.userId) : 'All');
  const [selectedMonth, setSelectedMonth] = useState(filters.month);
  const [selectedYear, setSelectedYear] = useState(filters.year);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];
  
  const years = [2023, 2024, 2025, 2026];
  
  const handleFilterChange = (newFilters) => {
    router.get(route('hrd.dashboard'), newFilters, {
      preserveState: true,
      preserveScroll: true,
    });
  };
  
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    handleFilterChange({ 
      month, 
      year: selectedYear,
      tower: selectedTower,
      divisi: selectedDivision !== 'All' ? selectedDivision : null,
      user_id: selectedPerson !== 'All' ? selectedPerson : null,
    });
  };
  
  const handleYearChange = (year) => {
    setSelectedYear(year);
    handleFilterChange({ 
      month: selectedMonth, 
      year,
      tower: selectedTower,
      divisi: selectedDivision !== 'All' ? selectedDivision : null,
      user_id: selectedPerson !== 'All' ? selectedPerson : null,
    });
  };
  
  const handleTowerChange = (tower) => {
    setSelectedTower(tower);
    handleFilterChange({ 
      month: selectedMonth, 
      year: selectedYear,
      tower,
      divisi: selectedDivision !== 'All' ? selectedDivision : null,
      user_id: selectedPerson !== 'All' ? selectedPerson : null,
    });
  };
  
  const handleDivisionChange = (divisi) => {
    setSelectedDivision(divisi);
    handleFilterChange({ 
      month: selectedMonth, 
      year: selectedYear,
      tower: selectedTower,
      divisi: divisi !== 'All' ? divisi : null,
      user_id: selectedPerson !== 'All' ? selectedPerson : null,
    });
  };
  
  const handlePersonChange = (userId) => {
    setSelectedPerson(userId);
    handleFilterChange({ 
      month: selectedMonth, 
      year: selectedYear,
      tower: selectedTower,
      divisi: selectedDivision !== 'All' ? selectedDivision : null,
      user_id: userId !== 'All' ? userId : null,
    });
  };

  const exportToCSV = () => {
    // Placeholder for CSV export functionality
    alert('Fungsi export CSV akan segera tersedia');
  };

  const clearFilters = () => {
    setSelectedDivision('All');
    setSelectedPerson('All');
    handleFilterChange({ 
      month: selectedMonth, 
      year: selectedYear,
      tower: selectedTower,
      divisi: null,
      user_id: null,
    });
  };
  
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1'];
  
  // Calculate additional metrics
  const attendanceRate = summaryStats.totalEmployees > 0 
    ? ((summaryStats.totalEmployees - summaryStats.totalLate) / summaryStats.totalEmployees * 100).toFixed(1)
    : 0;
    
  const avgLatePerEmployee = summaryStats.totalEmployees > 0 
    ? (summaryStats.totalLate / summaryStats.totalEmployees).toFixed(1)
    : 0;

  // Mock data for performance radar
  const performanceData = divisions.slice(0, 6).map(div => ({
    division: div,
    kehadiran: Math.floor(Math.random() * 30) + 70,
    ketepatan: Math.floor(Math.random() * 30) + 70,
    produktivitas: Math.floor(Math.random() * 30) + 70,
  }));

  // Mock comparison data
  const comparisonData = [
    { period: 'Jan', current: 45, previous: 52 },
    { period: 'Feb', current: 38, previous: 48 },
    { period: 'Mar', current: 42, previous: 45 },
    { period: 'Apr', current: 35, previous: 40 },
    { period: 'Mei', current: 30, previous: 38 },
    { period: 'Jun', current: 28, previous: 35 },
  ];

  // Mock hourly distribution
  const hourlyDistribution = [
    { hour: '07:00', count: 2 },
    { hour: '07:30', count: 5 },
    { hour: '08:00', count: 12 },
    { hour: '08:30', count: 18 },
    { hour: '09:00', count: 25 },
    { hour: '09:30', count: 15 },
    { hour: '10:00', count: 8 },
    { hour: '10:30+', count: 5 },
  ];

  return (
    <LayoutTemplate>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard HRD</h1>
                <p className="text-gray-600">Monitoring Kehadiran & Analisis Keterlambatan Karyawan</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 className="w-4 h-4" />
                    <span>{selectedTower}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button 
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Filter Lanjutan</h2>
                </div>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
                  <select 
                    value={selectedMonth}
                    onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => handleYearChange(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tower</label>
                  <select 
                    value={selectedTower}
                    onChange={(e) => handleTowerChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {towers.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Divisi</label>
                  <select 
                    value={selectedDivision}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">Semua Divisi</option>
                    {divisions.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Karyawan</label>
                  <select 
                    value={selectedPerson}
                    onChange={(e) => handlePersonChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">Semua Karyawan</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="lg:col-span-2 flex items-end">
                  <button 
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <TrendingDown className="w-5 h-5 opacity-50" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Keterlambatan</p>
              <p className="text-3xl font-bold">{summaryStats.totalLate}</p>
              <p className="text-xs opacity-75 mt-2">Periode ini</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <Activity className="w-5 h-5 opacity-50" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Karyawan</p>
              <p className="text-3xl font-bold">{summaryStats.totalEmployees}</p>
              <p className="text-xs opacity-75 mt-2">Karyawan aktif</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 opacity-50" />
              </div>
              <p className="text-sm opacity-90 mb-1">Tingkat Kehadiran</p>
              <p className="text-3xl font-bold">{attendanceRate}%</p>
              <p className="text-xs opacity-75 mt-2">Rata-rata kehadiran</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <AlertCircle className="w-5 h-5 opacity-50" />
              </div>
              <p className="text-sm opacity-90 mb-1">Terlambat ≥3x</p>
              <p className="text-3xl font-bold">{summaryStats.late3Times}</p>
              <p className="text-xs opacity-75 mt-2">Perlu perhatian khusus</p>
            </div>
          </div>

          {/* Additional Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rata-rata Keterlambatan</p>
                  <p className="text-2xl font-bold text-gray-900">{avgLatePerEmployee}x</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">Per karyawan bulan ini</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Tower</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.totalTowers}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">Lokasi aktif</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Divisi</p>
                  <p className="text-2xl font-bold text-gray-900">{divisions.length}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">Departemen aktif</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-lg mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'analysis'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Analisis Detail
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'comparison'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Perbandingan
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Top 10 Per Tower - Enhanced */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">Top 10 Keterlambatan per Tower</h2>
                  </div>
                  <select 
                    value={selectedTower}
                    onChange={(e) => handleTowerChange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {towers.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart data={top10PerTower}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="jumlah" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Keterlambatan per Divisi - Enhanced */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h2 className="text-xl font-bold text-gray-900">Distribusi per Divisi</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={lateByDivision}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {lateByDivision.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {lateByDivision.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-gray-700">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trend Keterlambatan - Enhanced */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-900">Trend Harian</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Divisi</label>
                      <select 
                        value={selectedDivision}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="All">Semua Divisi</option>
                        {divisions.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Karyawan</label>
                      <select 
                        value={selectedPerson}
                        onChange={(e) => handlePersonChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="All">Semua Karyawan</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={lateTrendData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <>
              {/* Hourly Distribution */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Distribusi Jam Keterlambatan</h2>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Radar */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">Performa per Divisi</h2>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={performanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="division" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Kehadiran" dataKey="kehadiran" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Radar name="Ketepatan Waktu" dataKey="ketepatan" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Radar name="Produktivitas" dataKey="produktivitas" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Comparison Tab */}
          {activeTab === 'comparison' && (
            <>
              {/* Month over Month Comparison */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">Perbandingan Bulanan</h2>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Periode Ini"
                      dot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="previous" 
                      stroke="#94a3b8" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Periode Sebelumnya"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Comparison Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">Penurunan</span>
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">-15%</p>
                    <p className="text-xs text-green-700 mt-1">vs bulan lalu</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">Rata-rata</span>
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">36</p>
                    <p className="text-xs text-blue-700 mt-1">keterlambatan/bulan</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-800">Target</span>
                      <Award className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">25</p>
                    <p className="text-xs text-purple-700 mt-1">keterlambatan/bulan</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Karyawan Terlambat >= 3x per Tower - Enhanced */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Karyawan Terlambat ≥ 3 Kali - {selectedTower}
                </h2>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-800">
                  {late3TimesData.length} Karyawan
                </span>
              </div>
            </div>
            
            {late3TimesData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Divisi</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tower</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Jumlah Terlambat</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {late3TimesData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                              {item.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500">ID: {item.id || `EMP${1000 + idx}`}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{item.divisi}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{item.tower}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              item.lateCount >= 5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {item.lateCount}
                            </div>
                            <span className="text-sm text-gray-600">kali</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.lateCount >= 5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.lateCount >= 5 ? '🚨 Perlu Perhatian' : '⚠️ Perhatian'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-600 hover:text-blue-800 font-medium mr-3">
                            Detail
                          </button>
                          <button className="text-orange-600 hover:text-orange-800 font-medium">
                            Tindak Lanjut
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</p>
                <p className="text-gray-500">
                  Tidak ada karyawan yang terlambat 3 kali atau lebih pada periode ini.
                </p>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm opacity-90 mb-1">Total Hari Kerja</p>
                <p className="text-3xl font-bold">{lateTrendData.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 mb-1">Persentase Keterlambatan</p>
                <p className="text-3xl font-bold">
                  {summaryStats.totalEmployees > 0 
                    ? ((summaryStats.totalLate / (summaryStats.totalEmployees * lateTrendData.length)) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 mb-1">Rata-rata per Hari</p>
                <p className="text-3xl font-bold">
                  {lateTrendData.length > 0 
                    ? (summaryStats.totalLate / lateTrendData.length).toFixed(1)
                    : 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 mb-1">Tingkat Disiplin</p>
                <p className="text-3xl font-bold">{attendanceRate}%</p>
              </div>
            </div>
          </div>

          {/* Updated timestamp */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Terakhir diperbarui: {new Date().toLocaleString('id-ID', { 
              dateStyle: 'full', 
              timeStyle: 'short' 
            })}</p>
          </div>
        </div>
      </div>
    </LayoutTemplate>
  );
}

export default Dashboard;