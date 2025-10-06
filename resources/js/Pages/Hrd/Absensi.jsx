import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, CheckCircle, XCircle,UserPlus ,X, AlertCircle, Search, Filter, Layout, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import ManualInputModal from '@/Layouts/ManualInputModal';
import { Head } from '@inertiajs/react';
function Absensi() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [kehadiranData, setKehadiranData] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTower, setActiveTower] = useState('Eiffel');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [rawKehadiranData, setRawKehadiranData] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


// Fungsi untuk mendapatkan CSRF token fresh
const fetchFreshCsrfToken = async () => {
  try {
    // Fetch halaman current untuk mendapatkan token baru
    const response = await fetch(window.location.href, {
      method: 'GET',
      credentials: 'same-origin'
    });
    
    if (response.ok) {
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newToken = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      if (newToken) {
        // Update meta tag di halaman current
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
          metaTag.setAttribute('content', newToken);
        }
        return newToken;
      }
    }
  } catch (error) {
    console.error('Error fetching fresh CSRF token:', error);
  }
  return null;
};

const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};
const handlePrintAbsensi = async () => {
  try {
    let csrfToken = getCsrfToken();
    
    const response = await fetch('/print-absensi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        tanggal: formatDateForAPI(selectedDate),
        tower: activeTower,
        kehadiran: currentKehadiran
      })
    });

    // Jika error 419, fetch token baru dan retry
    if (response.status === 419) {
      console.log('CSRF token expired, fetching new token...');
      const newToken = await fetchFreshCsrfToken();
      
      if (!newToken) {
        throw new Error('Gagal mendapatkan CSRF token baru. Silakan refresh halaman.');
      }

      // Retry dengan token baru
      const retryResponse = await fetch('/print-absensi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': newToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          tanggal: formatDateForAPI(selectedDate),
          tower: activeTower,
          kehadiran: currentKehadiran
        })
      });

      if (!retryResponse.ok) {
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }

      const blob = await retryResponse.blob();
      downloadFile(blob, `Absensi_${activeTower}_${formatDateForAPI(selectedDate)}.xlsx`);
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    downloadFile(blob, `Absensi_${activeTower}_${formatDateForAPI(selectedDate)}.xlsx`);
    
  } catch (error) {
    console.error('Error print absensi:', error);
    if (error.message.includes('419') || error.message.includes('CSRF')) {
      alert('Session Anda telah berakhir. Halaman akan di-refresh untuk memperbarui session.');
      window.location.reload();
    } else {
      alert(`Error: ${error.message}`);
    }
  }
};
const handlePrintKatering = async () => {
  try {
    let csrfToken = getCsrfToken();
    
    const response = await fetch('/print-katering', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        tanggal: formatDateForAPI(selectedDate),
        tower: activeTower,
        kehadiran: rawKehadiranData
      })
    });

    // Jika error 419, fetch token baru dan retry
    if (response.status === 419) {
      console.log('CSRF token expired, fetching new token...');
      const newToken = await fetchFreshCsrfToken();
      
      if (!newToken) {
        throw new Error('Gagal mendapatkan CSRF token baru. Silakan refresh halaman.');
      }

      // Retry dengan token baru
      const retryResponse = await fetch('/print-katering', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': newToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          tanggal: formatDateForAPI(selectedDate),
          tower: activeTower,
          kehadiran: rawKehadiranData
        })
      });

      if (!retryResponse.ok) {
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }

      const blob = await retryResponse.blob();
      downloadFile(blob, `Katering_${formatDateForAPI(selectedDate)}.xlsx`);
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    downloadFile(blob, `Katering_${formatDateForAPI(selectedDate)}.xlsx`);
    
  } catch (error) {
    console.error('Error print katering:', error);
    if (error.message.includes('419') || error.message.includes('CSRF')) {
      alert('Session Anda telah berakhir. Halaman akan di-refresh untuk memperbarui session.');
      window.location.reload();
    } else {
      alert(`Error: ${error.message}`);
    }
  }
};
const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  console.log('File downloaded successfully:', filename);
};
  const statusOptions = [
    { value: 'all', label: 'Semua Status', desc: 'Tampilkan semua data', color: 'bg-gray-500', textColor: 'text-white', borderColor: 'border-gray-500' },
    { value: 'N/A', label: 'N/A', desc: 'Status tidak tersedia', color: 'bg-gray-600', textColor: 'text-white', borderColor: 'border-gray-600' },
    { value: 'On Time', label: 'On Time', desc: 'Hadir tepat waktu', color: 'bg-green-600', textColor: 'text-white', borderColor: 'border-green-600' },
    { value: 'Terlambat', label: 'Terlambat', desc: 'Hadir terlambat', color: 'bg-orange-600', textColor: 'text-white', borderColor: 'border-orange-600' },
    { value: 'sakit', label: 'Sakit', desc: 'Tidak masuk karena sakit', color: 'bg-blue-600', textColor: 'text-white', borderColor: 'border-blue-600' },
    { value: 'C1', label: 'Cuti Full Day', desc: 'Mengambil cuti seharian penuh', color: 'bg-green-500', textColor: 'text-white', borderColor: 'border-green-500' },
    { value: 'C2', label: 'Cuti Setengah Hari', desc: 'Mengambil cuti setengah hari', color: 'bg-green-400', textColor: 'text-white', borderColor: 'border-green-400' },
    { value: 'P1', label: 'Ijin Full Day', desc: 'Izin tidak masuk kerja seharian', color: 'bg-blue-500', textColor: 'text-white', borderColor: 'border-blue-500' },
    { value: 'P2', label: 'Ijin Setengah Hari', desc: 'Izin tidak masuk setengah hari', color: 'bg-blue-400', textColor: 'text-white', borderColor: 'border-blue-400' },
    { value: 'P3', label: 'Ijin Keluar Kantor', desc: 'Izin keluar kantor sementara', color: 'bg-blue-300', textColor: 'text-blue-900', borderColor: 'border-blue-300' },
    { value: 'DL', label: 'Dinas Luar', desc: 'Bertugas di luar kantor', color: 'bg-purple-500', textColor: 'text-white', borderColor: 'border-purple-500' },
    { value: 'WFH', label: 'Work From Home', desc: 'Bekerja dari rumah', color: 'bg-orange-500', textColor: 'text-white', borderColor: 'border-orange-500' },
    { value: 'FP-TR', label: 'FP Tidak Ter-Record', desc: 'Fingerprint tidak terekam sistem', color: 'bg-red-500', textColor: 'text-white', borderColor: 'border-red-500' },
    { value: 'LK', label: 'Libur Kerja', desc: 'Hari libur resmi/nasional', color: 'bg-green-500', textColor: 'text-white', borderColor: 'border-gray-500' },
  ];

  useEffect(() => {
    fetchKehadiranData(selectedDate);
  }, [selectedDate]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, activeTower]);

  const fetchKehadiranData = async (date) => 
  {
    setLoading(true);
    try {
      const formattedDate = formatDateForAPI(date);
      const response = await fetch(`/kehadiran?tanggal=${formattedDate}`, {
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

      // SIMPAN DATA MENTAH
      setRawKehadiranData(data);

      const groupedByTower = data.reduce((acc, item) => {
        const tower = item.tower || 'Tanpa Tower';
        if (!acc[tower]) {
          acc[tower] = [];
        }
        acc[tower].push(item);
        return acc;
      }, {});

      setKehadiranData(groupedByTower);

      const towers = Object.keys(groupedByTower);
      if (towers.length > 0 && !towers.includes(activeTower)) {
        setActiveTower(towers[0]);
      }
    } catch (error) {
      console.error('Error fetching kehadiran:', error);
      alert(`Error: ${error.message}\n\nPastikan:\n1. Route /api/kehadiran sudah terdaftar\n2. Controller sudah dibuat\n3. Database terkoneksi`);
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

  const getStatusBadge = (status) => {
    const statusInfo = statusOptions.find(s => s.value === status) || {
      label: status || 'Unknown',
      color: 'bg-gray-500',
      textColor: 'text-white',
      borderColor: 'border-gray-500'
    };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
        {statusInfo.label}
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

  // Pagination logic
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
  
  const towers = Object.keys(kehadiranData);
  const currentKehadiran = kehadiranData[activeTower] || [];
  const filteredKehadiran = filterKehadiranData(currentKehadiran);
  const paginatedKehadiran = getPaginatedData(filteredKehadiran);
  const totalPages = getTotalPages(filteredKehadiran.length);

  const activeStatusOption = statusOptions.find(s => s.value === statusFilter) || statusOptions[0];
 const handleManualSave = () => {
    fetchKehadiranData(selectedDate);
 }
  return (
    <LayoutTemplate>
              <Head title="Absensi" />

        <ManualInputModal 
        isOpen={showManualInput}
        kalender={selectedDate}
        onClose={() => setShowManualInput(false)} 
        onSave={handleManualSave}
      />

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Data Kehadiran</h1>
            </div>
            <p className="text-gray-600 ml-14">Pilih tanggal untuk melihat data kehadiran karyawan</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Column - Calendar */}
           <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sticky top-4">
              {/* Calendar Header - ukuran lebih kecil */}
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

              {/* Calendar Grid - ukuran lebih kecil */}
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
                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`aspect-square rounded-lg flex items-center justify-center font-semibold transition-all text-xs
                        ${isSelectedDate(day) 
                          ? 'bg-indigo-600 text-white shadow-lg scale-105 ring-2 ring-indigo-300' 
                          : isToday(day) 
                          ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400' 
                          : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              
              {/* Selected Date Info - ukuran lebih kecil */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] text-gray-500 mb-1">Tanggal Dipilih</p>
                <p className="text-xs font-bold text-indigo-600">
                  {formatDateDisplay(selectedDate)}
                </p>
              </div>
            </div>
          </div>


            {/* Right Column - Kehadiran Data */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                  <p className="mt-4 text-gray-600 font-medium">Memuat data kehadiran...</p>
                </div>
              ) : towers.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Tidak Ada Data</h3>
                  <p className="text-gray-600">Tidak ada data kehadiran untuk tanggal yang dipilih</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  {/* Tower Navigation Tabs */}
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {towers.map((tower) => (
                        <button
                          key={tower}
                          onClick={() => setActiveTower(tower)}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                            activeTower === tower
                              ? 'bg-white text-indigo-600 shadow-lg'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          {tower}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Users className="w-4 h-4 text-indigo-100" />
                      <p className="text-indigo-100 text-sm">
                        Menampilkan {paginatedKehadiran.length} dari {filteredKehadiran.length} karyawan
                        {filteredKehadiran.length !== currentKehadiran.length && ` (Total: ${currentKehadiran.length})`}
                      </p>
                    </div>
                  </div>

                  {/* Print Buttons Row */}
                  <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={handlePrintAbsensi}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium shadow-md"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Absensi</span>
                      </button>

                      <button
                        onClick={handlePrintKatering}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium shadow-md"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Katering</span>
                      </button>
                      <button
                        onClick={() => setShowManualInput(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <UserPlus className="h-5 w-5" />
                        Tambah Manual
                      </button>
                    </div>
                  </div>

                  {/* Search and Filter Section */}
                  <div className="p-5 bg-gray-50 border-b border-gray-200">
                    <div className="flex gap-3 flex-wrap">
                      {/* Search Box */}
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

                      {/* Status Filter Dropdown */}
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
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 max-h-[400px] overflow-y-auto">
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

                      {/* Items Per Page Selector */}
                  

                      {/* Reset Filters */}
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
                  
                  {/* Kehadiran List */}
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
                            key={idx} 
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
                              {getStatusBadge(item.status)}
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
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {filteredKehadiran.length > 0 && totalPages > 1 && (
                    <div className="p-5 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        {/* Page Info */}
                        <div className="text-sm text-gray-600">
                          Halaman <span className="font-bold text-gray-800">{currentPage}</span> dari{' '}
                          <span className="font-bold text-gray-800">{totalPages}</span>
                        </div>

                        {/* Pagination Buttons */}
                        <div className="flex items-center gap-2">
                          {/* Previous Button */}
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

                          {/* Page Numbers */}
                          <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              // Show first page, last page, current page, and pages around current
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

                          {/* Next Button */}
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