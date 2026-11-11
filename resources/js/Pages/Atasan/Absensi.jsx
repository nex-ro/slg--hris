import { useState, useEffect } from 'react';
import { Calendar, Users, ChevronDown, FileText, Clock, AlertCircle, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
function Absensi({ divisi }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [kehadiranData, setKehadiranData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  // Fungsi untuk mengecek apakah tanggal adalah weekend (Sabtu/Minggu)
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; 
  };

  const isHoliday = (date) => {
    const dateString = formatDateForAPI(date);
    return holidays.some(holiday => holiday.date === dateString);
  };

  // Fungsi untuk mendapatkan nama hari libur
  const getHolidayName = (date) => {
    const dateString = formatDateForAPI(date);
    const holiday = holidays.find(h => h.date === dateString);
    return holiday ? holiday.name : null;
  };

  useEffect(() => {
    fetchHolidays(currentMonth.getFullYear());
  }, [currentMonth]);

  const fetchHolidays = async (year) => {
    try {
      const response = await fetch(`/api/holidays?year=${year}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response bukan JSON, kemungkinan route belum dibuat');
        return;
      }

      const data = await response.json();
      
      // Normalize data: ubah format date dari ISO ke YYYY-MM-DD
      const normalizedData = data.map(holiday => ({
        ...holiday,
        date: holiday.date.split('T')[0]
      }));
      
      setHolidays(normalizedData);
    } catch (error) {
      console.error('Error fetching holidays:', error.message);
      setHolidays([]);
    }
  };

 const statusOptions = [
  { value: 'all', label: 'Semua Status', desc: 'Tampilkan semua data', color: 'bg-gray-500', textColor: 'text-white', borderColor: 'border-gray-500' },
  { value: 'N/A', label: 'N/A', desc: 'Status tidak tersedia', color: 'bg-gray-600', textColor: 'text-white', borderColor: 'border-gray-600' },
  { value: 'On Time', label: 'On Time', desc: 'Hadir tepat waktu', color: 'bg-green-600', textColor: 'text-white', borderColor: 'border-green-600' },
  { value: 'Terlambat', label: 'Terlambat', desc: 'Hadir terlambat', color: 'bg-orange-600', textColor: 'text-white', borderColor: 'border-orange-600' },
  { value: 'Sakit', label: 'Sakit', desc: 'Tidak masuk karena sakit', color: 'bg-blue-600', textColor: 'text-white', borderColor: 'border-blue-600' },
  { value: 'C1', label: 'Cuti Full Day', desc: 'Mengambil cuti seharian penuh', color: 'bg-green-500', textColor: 'text-white', borderColor: 'border-green-500' },
  { value: 'C2', label: 'Cuti Setengah Hari', desc: 'Mengambil cuti setengah hari', color: 'bg-green-400', textColor: 'text-white', borderColor: 'border-green-400' },
  { value: 'P1', label: 'Ijin Full Day', desc: 'Izin tidak masuk kerja seharian', color: 'bg-blue-500', textColor: 'text-white', borderColor: 'border-blue-500' },
  { value: 'P2', label: 'Ijin Setengah Hari', desc: 'Izin tidak masuk setengah hari', color: 'bg-blue-400', textColor: 'text-white', borderColor: 'border-blue-400' },
  { value: 'P3', label: 'Ijin Keluar Kantor', desc: 'Izin keluar kantor sementara', color: 'bg-blue-300', textColor: 'text-blue-900', borderColor: 'border-blue-300' },
  { value: 'DL', label: 'Dinas Luar', desc: 'Bertugas di luar kantor', color: 'bg-purple-500', textColor: 'text-white', borderColor: 'border-purple-500' },
  { value: 'WFH', label: 'Work From Home', desc: 'Bekerja dari rumah', color: 'bg-orange-500', textColor: 'text-white', borderColor: 'border-orange-500' },
  { value: 'FP-TR', label: 'FP Tidak Ter-Record', desc: 'Fingerprint tidak terekam sistem', color: 'bg-red-500', textColor: 'text-white', borderColor: 'border-red-500' },
  { value: 'LK', label: 'Libur Kerja', desc: 'Hari libur resmi/nasional', color: 'bg-green-500', textColor: 'text-white', borderColor: 'border-gray-500' },
  { value: 'Site', label: 'Site', desc: 'Bertugas di lokasi site', color: 'bg-yellow-500', textColor: 'text-white', borderColor: 'border-yellow-500' }, // ✅ TAMBAH INI
];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchKehadiranData(selectedDate);
  }, [selectedDate]);

  const fetchKehadiranData = async (date) => {
    setLoading(true);
    try {
      const formattedDate = formatDateForAPI(date);
      
      const response = await fetch(`/kehadiran/divisi?tanggal=${formattedDate}&divisi=${encodeURIComponent(divisi)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Response is not JSON:', text.substring(0, 200));
        throw new Error('Server tidak mengembalikan JSON. Periksa route API Anda.');
      }

      const data = await response.json();
      setKehadiranData(data);

    } catch (error) {
      console.error('Error fetching kehadiran:', error);
      // alert(`Error: ${error.message}\n\nPastikan:\n1. Route /kehadiran/divisi sudah terdaftar\n2. Controller sudah dibuat\n3. Database terkoneksi`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelectedDate = (day) => {
    return day === selectedDate.getDate() && 
           currentMonth.getMonth() === selectedDate.getMonth() && 
           currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const getStatusBadge = (item) => {
    const status = item.status;
    
    const statusInfo = statusOptions.find(s => s.value === status) || {
      label: status || 'Unknown',
      color: 'bg-gray-500',
      textColor: 'text-white',
      borderColor: 'border-gray-500'
    };
    
    // VIEW ONLY - Hanya tampilkan badge tanpa interaksi
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
        {statusInfo.label}
        {status === 'Terlambat' && item.keterangan && (
          <span className="ml-1 text-[10px] opacity-75">✓</span>
        )}
      </span>
    );
  };

  const filterKehadiranData = (data) => {
    return data.filter(item => {
      const matchesSearch = !searchQuery || 
        (item.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.user?.id || '').toString().includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  
  const filteredKehadiran = filterKehadiranData(kehadiranData);
  const paginatedKehadiran = getPaginatedData(filteredKehadiran);
  const totalPages = getTotalPages(filteredKehadiran.length);

  const activeStatusOption = statusOptions.find(s => s.value === statusFilter) || statusOptions[0];

  return (
    <LayoutTemplate>
      <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Data Kehadiran</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                  Divisi: {divisi || 'IT'}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                  Mode: View Only
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 ml-14">Pilih tanggal untuk melihat data kehadiran karyawan divisi {divisi || 'IT'}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-indigo-50 rounded-lg transition text-indigo-600"
                  title="Bulan Sebelumnya"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-sm font-bold text-gray-800">
                  {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-indigo-50 rounded-lg transition text-indigo-600"
                  title="Bulan Berikutnya"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => (
                  <div key={day} className="text-center font-bold text-gray-500 py-1.5 text-[10px]">
                    {day}
                  </div>
                ))}

                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isWeekendDay = isWeekend(currentDate);
                  const isHolidayDay = isHoliday(currentDate);
                  const holidayName = getHolidayName(currentDate);
                  
                  return (
                    <div key={day} className="relative group">
                      <button
                        onClick={() => handleDateClick(day)}
                        className={`aspect-square rounded-lg flex items-center justify-center font-semibold transition-all text-xs w-full
                          ${isSelectedDate(day) 
                            ? 'bg-indigo-600 text-white shadow-lg scale-105 ring-2 ring-indigo-300' 
                            : isToday(day) 
                            ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400' 
                            : (isWeekendDay || isHolidayDay)
                            ? 'bg-red-100 text-red-700 font-bold hover:bg-red-200'
                            : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                          }`}
                      >
                        {day}
                      </button>
                      {holidayName && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {holidayName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] text-gray-500 mb-1">Tanggal Dipilih</p>
                <p className="text-xs font-bold text-indigo-600">
                  {formatDateDisplay(selectedDate)}
                </p>
                {(isWeekend(selectedDate) || isHoliday(selectedDate)) && (
                  <div className="mt-2 px-2 py-1 bg-red-100 text-red-700 text-[10px] font-semibold rounded">
                    {isHoliday(selectedDate) ? getHolidayName(selectedDate) : 'Akhir Pekan'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                <p className="mt-4 text-gray-600 font-medium">Memuat data kehadiran...</p>
              </div>
            ) : kehadiranData.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Tidak Ada Data</h3>
                <p className="text-gray-600">Tidak ada data kehadiran untuk tanggal yang dipilih</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-bold text-white">Data Kehadiran</h2>
                  </div>
                  <p className="text-indigo-100 text-sm mt-2">
                    Menampilkan {paginatedKehadiran.length} dari {filteredKehadiran.length} karyawan
                    {filteredKehadiran.length !== kehadiranData.length && ` (Total: ${kehadiranData.length})`}
                  </p>
                </div>

                <div className="p-5 bg-gray-50 border-b border-gray-200">
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cari nama atau ID karyawan..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium text-sm transition-all ${
                          statusFilter === 'all' 
                            ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' 
                            : `${activeStatusOption.color} ${activeStatusOption.textColor} border-transparent shadow-md`
                        }`}
                      >
                        <Filter className="w-4 h-4" />
                        <span>{activeStatusOption.label}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showFilterDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowFilterDropdown(false)}
                          />
                          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 max-h-[350px] overflow-y-auto">
                            <div className="p-2">
                              {statusOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => {
                                    setStatusFilter(option.value);
                                    setShowFilterDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all ${
                                    statusFilter === option.value ? 'bg-indigo-50' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-sm text-gray-800">{option.label}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${option.color} ${option.textColor}`}>
                                      {option.value === 'all' ? 'All' : option.value}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">{option.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {(searchQuery || statusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-3" style={{ minHeight: '350px' }}>
                  {filteredKehadiran.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">
                        {searchQuery || statusFilter !== 'all' 
                          ? 'Tidak ada data yang sesuai dengan filter' 
                          : 'Tidak ada data kehadiran untuk tower ini'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {paginatedKehadiran.map((item, idx) => (
                        <div 
                          key={item.id || `temp-${item.user?.id}-${idx}`}
                          className="border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all bg-gradient-to-r from-gray-50 to-white"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                                {(item.user?.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800">
                                  {item.user?.name || 'Nama Tidak Tersedia'}
                                </h4>
                                <p className="text-xs text-gray-500">ID: {item.user?.id || '-'}</p>
                              </div>
                            </div>
                            {getStatusBadge(item)}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <Clock className="w-4 h-4 text-green-600" />
                              <span className="font-medium">Masuk:</span>
                              <span className="font-bold text-gray-800">{item.jam_kedatangan || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="font-medium">Pulang:</span>
                              <span className="font-bold text-gray-800">{item.jam_pulang || '-'}</span>
                            </div>
                          </div>

                          {item.status === 'Terlambat' && item.keterangan && (
                            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-orange-700 mb-1">Keterangan:</p>
                                  <p className="text-xs text-orange-600 leading-relaxed">{item.keterangan}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {filteredKehadiran.length > 0 && totalPages > 1 && (
                  <div className="p-5 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="text-sm text-gray-600">
                        Halaman <span className="font-bold text-gray-800">{currentPage}</span> dari{' '}
                        <span className="font-bold text-gray-800">{totalPages}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                            currentPage === 1
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Prev</span>
                        </button>

                        <div className="flex gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            const showPage = 
                              page === 1 || 
                              page === totalPages || 
                              (page >= currentPage - 1 && page <= currentPage + 1);

                            if (!showPage && page === 2) {
                              return <span key={page} className="px-2 py-2 text-gray-400">...</span>;
                            }
                            if (!showPage && page === totalPages - 1) {
                              return <span key={page} className="px-2 py-2 text-gray-400">...</span>;
                            }
                            if (!showPage) {
                              return null;
                            }

                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                                  currentPage === page
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                            currentPage === totalPages
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'
                          }`}
                        >
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </LayoutTemplate>
  );
}

export default Absensi;