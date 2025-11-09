import { useState, useEffect } from 'react';
import { Calendar, Users,FileSpreadsheet,ChevronDown,FileText, Clock, CheckCircle, XCircle,UserPlus ,X, AlertCircle, Search, Filter, Layout, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [showKateringModal, setShowKateringModal] = useState(false);
  const [showAbsensiModal, setShowAbsensiModal] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showKeteranganModal, setShowKeteranganModal] = useState(false);
  const [selectedKehadiran, setSelectedKehadiran] = useState(null);
  const [keteranganText, setKeteranganText] = useState('');

  const [showYangMakanModal, setShowYangMakanModal] = useState(false); // ubah nama
  const [selectedYangMakan, setSelectedYangMakan] = useState([]); // ubah nama
  const [tempSelectedYangMakan, setTempSelectedYangMakan] = useState([]); // ubah nama
  const [searchYangMakan, setSearchYangMakan] = useState(''); // ubah nama
  const [exportFormat, setExportFormat] = useState(null);
const [statusDropdownPosition, setStatusDropdownPosition] = useState({});

  const getAllKaryawanHadir = () => {
  return rawKehadiranData.filter(item => {
    const status = (item.status || '').toLowerCase().trim();
    return ['ontime', 'on time', 'hadir', 'terlambat', 'late', 'telat', 'fp-tr', 'c2', 'p2'].includes(status);
  });
};

useEffect(() => {
  const handleStatusDropdownPosition = () => {
    if (openStatusDropdown !== null) {
      const buttonElement = document.querySelector(`[data-status-dropdown="${openStatusDropdown}"]`);
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Jika space di bawah kurang dari 320px dan space di atas lebih besar
        if (spaceBelow < 320 && spaceAbove > spaceBelow) {
          setStatusDropdownPosition(prev => ({...prev, [openStatusDropdown]: 'top'}));
        } else {
          setStatusDropdownPosition(prev => ({...prev, [openStatusDropdown]: 'bottom'}));
        }
      }
    }
  };

  handleStatusDropdownPosition();
  window.addEventListener('scroll', handleStatusDropdownPosition);
  window.addEventListener('resize', handleStatusDropdownPosition);

  return () => {
    window.removeEventListener('scroll', handleStatusDropdownPosition);
    window.removeEventListener('resize', handleStatusDropdownPosition);
  };
}, [openStatusDropdown]);

const toggleSelectYangMakan = (userId) => {
  setTempSelectedYangMakan(prev => {
    if (prev.includes(userId)) {
      return prev.filter(id => id !== userId);
    } else {
      return [...prev, userId];
    }
  });
};


const handleConfirmYangMakan = () => {
  setSelectedYangMakan(tempSelectedYangMakan);
  setShowYangMakanModal(false);
  
  // Dapatkan semua karyawan yang hadir
  const karyawanHadir = getAllKaryawanHadir();
  const allUserIds = karyawanHadir.map(k => k.user?.id || k.uid).filter(id => id);
  
  // Hitung yang TIDAK dipilih (tidak makan)
  const yangTidakMakan = allUserIds.filter(id => !tempSelectedYangMakan.includes(id));
  
  // Lanjutkan export dengan mengirim yang TIDAK MAKAN
  if (exportFormat === 'excel') {
    handlePrintKateringFormatFinal('excel', yangTidakMakan);
  } else if (exportFormat === 'pdf') {
    handlePrintKateringFormatFinal('pdf', yangTidakMakan);
  }
  
  // Reset
  setSearchYangMakan('');
  setExportFormat(null);
};



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
  useEffect(() => {
  const interval = setInterval(() => {
    fetchKehadiranData(selectedDate);
  }, 30000); // 30 detik

  return () => clearInterval(interval);
}, [selectedDate]);
// Auto-refresh hanya ketika tab browser aktif
useEffect(() => {
  let interval;
  
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      fetchKehadiranData(selectedDate);
      interval = setInterval(() => {
        fetchKehadiranData(selectedDate);
      }, 30000);
    } else {
      clearInterval(interval);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Start interval immediately
  interval = setInterval(() => {
    fetchKehadiranData(selectedDate);
  }, 30000);

  return () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [selectedDate]);

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

    // Cek apakah response benar-benar JSON
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
    // Set holidays kosong jika error
    setHolidays([]);
  }
};

  // Fungsi untuk mendapatkan CSRF token fresh
  const fetchFreshCsrfToken = async () => {
    try {
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

  const handlePrintAbsensi = () => {
    setShowAbsensiModal(true);
  };
  const editableStatusOptions = [
  { value: 'Sakit', label: 'Sakit', desc: 'Tidak Masuk kerja', color: 'bg-red-400', textColor: 'text-white', borderColor: 'border-red-400' },
  { value: 'P1', label: 'Ijin Full Day', desc: 'Izin tidak masuk kerja seharian', color: 'bg-blue-500', textColor: 'text-white', borderColor: 'border-blue-500' },
  { value: 'P2', label: 'Ijin Setengah Hari', desc: 'Izin tidak masuk setengah hari', color: 'bg-blue-400', textColor: 'text-white', borderColor: 'border-blue-400' },
  { value: 'P3', label: 'Ijin Keluar Kantor', desc: 'Izin keluar kantor sementara', color: 'bg-blue-300', textColor: 'text-blue-900', borderColor: 'border-blue-300' },
  { value: 'C1', label: 'Cuti Full Day', desc: 'Mengambil cuti seharian penuh', color: 'bg-green-500', textColor: 'text-white', borderColor: 'border-green-500' },
  { value: 'C2', label: 'Cuti Setengah Hari', desc: 'Mengambil cuti setengah hari', color: 'bg-green-400', textColor: 'text-white', borderColor: 'border-green-400' },
  { value: 'DL', label: 'Dinas Luar', desc: 'Bertugas di luar kantor', color: 'bg-purple-500', textColor: 'text-white', borderColor: 'border-purple-500' },
  { value: 'WFH', label: 'Work From Home', desc: 'Bekerja dari rumah', color: 'bg-orange-500', textColor: 'text-white', borderColor: 'border-orange-500' },
  { value: 'FP-TR', label: 'FP Tidak Ter-Record', desc: 'Fingerprint tidak terekam sistem', color: 'bg-red-500', textColor: 'text-white', borderColor: 'border-red-500' },

];
// Helper function untuk fetch dengan CSRF token otomatis retry
const fetchWithCsrf = async (url, options = {}) => {
  let csrfToken = getCsrfToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json'
    },
    credentials: 'same-origin',
    ...options
  };

  let response = await fetch(url, defaultOptions);

  // Jika 419 (CSRF mismatch), coba refresh token dan retry
  if (response.status === 419) {
    const newToken = await fetchFreshCsrfToken();
    
    if (!newToken) {
      throw new Error('Gagal mendapatkan CSRF token baru. Silakan refresh halaman.');
    }

    // Retry dengan token baru
    defaultOptions.headers['X-CSRF-TOKEN'] = newToken;
    response = await fetch(url, defaultOptions);
  }

  return response;
};
const handleStatusChange = async (kehadiranId, newStatus, userData = null, tanggal = null) => {
  setUpdatingStatus(true);
  try {
    let csrfToken = getCsrfToken();
    
    const payload = {
      status: newStatus,
      jam_kedatangan: '00:00',
      jam_pulang: '00:00'
    };

    // Jika ID null, berarti create new
    if (kehadiranId) {
      payload.id = kehadiranId;
    } else {
      // Data untuk create new
      payload.tanggal = tanggal || formatDateForAPI(selectedDate);
      payload.uid = userData?.id;
    }
    

    const response = await fetch('/kehadiran/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });

    if (response.status === 419) {
      const newToken = await fetchFreshCsrfToken();
      
      if (!newToken) {
        throw new Error('Gagal mendapatkan CSRF token baru. Silakan refresh halaman.');
      }

      const retryResponse = await fetch('/kehadiran/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': newToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      if (!retryResponse.ok) {
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }
    } else if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Refresh data setelah berhasil update
    await fetchKehadiranData(selectedDate);
    setOpenStatusDropdown(null);
    
  } catch (error) {
    console.error('Error updating status:', error);
    if (error.message.includes('419') || error.message.includes('CSRF')) {
      alert('Session Anda telah berakhir. Halaman akan di-refresh untuk memperbarui session.');
      window.location.reload();
    } else {
      alert(`Error: ${error.message}`);
    }
  } finally {
    setUpdatingStatus(false);
  }
};

  const handlePrintAbsensiFormat = async (format) => {
    try {
      setShowAbsensiModal(false);
      let csrfToken = getCsrfToken();
      
      const endpoint = format === 'pdf' ? '/print-absensi-pdf' : '/print-absensi';
      const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';
      
      const response = await fetch(endpoint, {
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

      if (response.status === 419) {
        const newToken = await fetchFreshCsrfToken();
        
        if (!newToken) {
          throw new Error('Gagal mendapatkan CSRF token baru. Silakan refresh halaman.');
        }

        const retryResponse = await fetch(endpoint, {
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
        downloadFile(blob, `Absensi_${activeTower}_${formatDateForAPI(selectedDate)}.${fileExtension}`);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      downloadFile(blob, `Absensi_${activeTower}_${formatDateForAPI(selectedDate)}.${fileExtension}`);
      
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

  const handlePrintKatering = () => {
    setShowKateringModal(true);
  };

  const handlePrintKateringFormat = async (format) => {
  setShowKateringModal(false);
  setExportFormat(format);
  
  // Ambil semua karyawan yang hadir
  const karyawanHadir = getAllKaryawanHadir();
  
  if (karyawanHadir.length === 0) {
    alert('Tidak ada karyawan yang hadir untuk dicetak');
    return;
  }
  
  const allUserIds = karyawanHadir.map(k => k.user?.id || k.uid).filter(id => id);
  setTempSelectedYangMakan(allUserIds);
  setShowYangMakanModal(true);
};


const handlePrintKateringFormatFinal = async (format, yangMakanIds) => {
  try {
    let csrfToken = getCsrfToken();
    
    const endpoint = format === 'pdf' ? '/print-katering-pdf' : '/print-katering';
    const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';
    console.log(yangMakanIds)
    const response = await fetch(endpoint, {
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
        kehadiran: rawKehadiranData,
        yang_makan: yangMakanIds // KIRIM DATA YANG MAKAN (bukan tidak_makan)
      })
    });

    if (response.status === 419) {
      const newToken = await fetchFreshCsrfToken();
      
      if (!newToken) {
        throw new Error('Gagal mendapatkan CSRF token baru. Silakan refresh halaman.');
      }

      const retryResponse = await fetch(endpoint, {
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
          kehadiran: rawKehadiranData,
          yang_makan: yangMakanIds
        })
      });

      if (!retryResponse.ok) {
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }

      const blob = await retryResponse.blob();
      downloadFile(blob, `Katering_${formatDateForAPI(selectedDate)}.${fileExtension}`);
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    downloadFile(blob, `Katering_${formatDateForAPI(selectedDate)}.${fileExtension}`);
    
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

// UBAH MODAL COMPONENT (UI berubah: checked = makan, unchecked = tidak makan)
const ModalYangMakan = () => {
  const karyawanHadir = getAllKaryawanHadir();
  const filteredKaryawan = karyawanHadir.filter(item => {
    const nama = (item.user?.name || item.nama || '').toLowerCase();
    const search = searchYangMakan.toLowerCase();
    return nama.includes(search);
  });

  const totalYangMakan = tempSelectedYangMakan.length;
  const totalTidakMakan = karyawanHadir.length - totalYangMakan;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Daftar Karyawan Yang Makan</h3>
                <p className="text-green-100 text-sm mt-1">
                  <span className="font-bold">{totalYangMakan}</span> makan • 
                  <span className="font-bold ml-1">{totalTidakMakan}</span> tidak makan • 
                  <span className="ml-1">dari {karyawanHadir.length} karyawan</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowYangMakanModal(false);
                setSearchYangMakan('');
                setExportFormat(null);
              }}
              className="text-white hover:bg-white/20 p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar - PINDAHKAN KE DALAM CONTAINER DENGAN PADDING */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Cari nama karyawan..."
              value={searchYangMakan}
              onChange={(e) => setSearchYangMakan(e.target.value)}
              maxLength={50}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              autoComplete="off"
            />
            {searchYangMakan && (
              <button
                onClick={() => setSearchYangMakan('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Tombol Select All / Deselect All */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setTempSelectedYangMakan(karyawanHadir.map(k => k.user?.id || k.uid))}
              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium"
            >
              ✓ Semua Makan
            </button>
            <button
              onClick={() => setTempSelectedYangMakan([])}
              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
            >
              ✗ Semua Tidak Makan
            </button>
          </div>
        </div>

        {/* List Karyawan */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredKaryawan.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Tidak ada karyawan ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredKaryawan.map((item) => {
                const userId = item.user?.id || item.uid;
                const isMakan = tempSelectedYangMakan.includes(userId);
                
                return (
                  <button
                    key={userId}
                    onClick={() => toggleSelectYangMakan(userId)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      isMakan
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isMakan
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-red-400'
                    }`}>
                      {isMakan && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        isMakan ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {(item.user?.name || item.nama || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="font-semibold text-gray-800">
                          {item.user?.name || item.nama || 'Nama Tidak Tersedia'}
                        </h4>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">
                            {item.tower || 'Tower'} • ID: {userId || '-'}
                          </p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isMakan 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {isMakan ? 'MAKAN' : 'TIDAK MAKAN'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
          <button
            onClick={() => {
              setShowYangMakanModal(false);
              setSearchYangMakan('');
              setExportFormat(null);
            }}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleConfirmYangMakan}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Konfirmasi & Export ({totalYangMakan} porsi)
          </button>
        </div>
      </div>
    </div>
  );
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
  ];

  useEffect(() => {
    fetchKehadiranData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, activeTower]);

  const fetchKehadiranData = async (date) => {
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

  const handleUpdateKeterangan = async () => {
  if (!selectedKehadiran || !keteranganText.trim()) {
    alert('Keterangan tidak boleh kosong!');
    return;
  }

  setUpdatingStatus(true);
  try {
    let csrfToken = getCsrfToken();
    
    const response = await fetch('/kehadiran/update-keterangan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        id: selectedKehadiran.id,
        keterangan: keteranganText
      })
    });

    if (response.status === 419) {
      const newToken = await fetchFreshCsrfToken();
      
      if (!newToken) {
        throw new Error('Gagal mendapatkan CSRF token baru. Silakan refresh halaman.');
      }

      const retryResponse = await fetch('/kehadiran/update-keterangan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': newToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          id: selectedKehadiran.id,
          keterangan: keteranganText
        })
      });

      if (!retryResponse.ok) {
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }
    } else if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Refresh data setelah berhasil update
    await fetchKehadiranData(selectedDate);
    setShowKeteranganModal(false);
    setKeteranganText('');
    setSelectedKehadiran(null);
    
  } catch (error) {
    console.error('Error updating keterangan:', error);
    if (error.message.includes('419') || error.message.includes('CSRF')) {
      alert('Session Anda telah berakhir. Halaman akan di-refresh untuk memperbarui session.');
      window.location.reload();
    } else {
      alert(`Error: ${error.message}`);
    }
  } finally {
    setUpdatingStatus(false);
  }
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

const getStatusBadge = (item, idx) => {
  const status = item.status;
  const kehadiranId = item.id;
  
  // Cari status info dari editableStatusOptions untuk status yang sudah diubah
  const editableStatusInfo = editableStatusOptions.find(s => s.value === status);
  
  const statusInfo = editableStatusInfo || statusOptions.find(s => s.value === status) || {
    label: status || 'Unknown',
    color: 'bg-gray-500',
    textColor: 'text-white',
    borderColor: 'border-gray-500'
  };
  
  // Jika status adalah N/A, tampilkan dropdown
  if (status === 'N/A') {
    return (
      <div className="relative">
        <button
          data-status-dropdown={idx}
          onClick={() => setOpenStatusDropdown(openStatusDropdown === idx ? null : idx)}
          disabled={updatingStatus}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} ${statusInfo.textColor} ${statusInfo.borderColor} hover:opacity-80 transition-all ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {statusInfo.label}
          <ChevronDown className="w-3 h-3" />
        </button>

        {openStatusDropdown === idx && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setOpenStatusDropdown(null)}
            />
            <div className={`absolute right-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 max-h-80 overflow-y-auto ${
              statusDropdownPosition[idx] === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}>
              <div className="p-2">
                <div className="px-3 py-2 border-b border-gray-200 mb-1">
                  <p className="text-xs font-bold text-gray-700">
                    Ubah Status {kehadiranId ? `(ID: ${kehadiranId})` : '(Buat Baru)'}
                  </p>
                </div>
                {editableStatusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(
                      kehadiranId, 
                      option.value, 
                      item.user, 
                      formatDateForAPI(selectedDate)
                    )}
                    disabled={updatingStatus}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-all ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-gray-800">{option.label}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${option.color} ${option.textColor}`}>
                        {option.value}
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
    );
  }
  
  if (status === 'Terlambat') {
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
          {statusInfo.label}
          {item.keterangan && (
            <span className="ml-1 text-[10px] opacity-75">✓</span>
          )}
        </span>
        {/* Icon HANYA muncul jika BELUM ada keterangan */}
        {!item.keterangan && (
          <button
            onClick={() => {
              setSelectedKehadiran(item);
              setKeteranganText('');
              setShowKeteranganModal(true);
            }}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-1.5 rounded-lg transition-all"
            title="Tambah keterangan"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
  
  // Untuk status lainnya, tampilkan badge biasa dengan warna yang sesuai
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
  };

  return (
    <LayoutTemplate>
      <Head title="Absensi" />
      {showKeteranganModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Keterangan Keterlambatan</h3>
          </div>
          <button
            onClick={() => {
              setShowKeteranganModal(false);
              setKeteranganText('');
              setSelectedKehadiran(null);
            }}
            className="text-white hover:bg-white/20 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {selectedKehadiran && (
          <p className="text-orange-100 text-sm mt-2">
            {selectedKehadiran.user?.name} - {selectedKehadiran.jam_kedatangan}
          </p>
        )}
      </div>

      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Alasan Keterlambatan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={keteranganText}
            onChange={(e) => setKeteranganText(e.target.value)}
            placeholder="Contoh: Terjebak macet di jalan tol..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
            disabled={updatingStatus}
          />
          <p className="text-xs text-gray-500 mt-1">
            {keteranganText.length}/500 karakter
          </p>
        </div>

        {selectedKehadiran?.keterangan && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 mb-1">Keterangan Sebelumnya:</p>
            <p className="text-xs text-blue-600">{selectedKehadiran.keterangan}</p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
        <button
          onClick={() => {
            setShowKeteranganModal(false);
            setKeteranganText('');
            setSelectedKehadiran(null);
          }}
          className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          disabled={updatingStatus}
        >
          Batal
        </button>
        <button
          onClick={handleUpdateKeterangan}
          disabled={updatingStatus || !keteranganText.trim()}
          className={`flex-1 px-4 py-2.5 rounded-lg transition font-medium ${
            updatingStatus || !keteranganText.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
        >
          {updatingStatus ? 'Menyimpan...' : 'Simpan Keterangan'}
        </button>
      </div>
    </div>
  </div>
)}

      {showYangMakanModal && <ModalYangMakan/>}
      {showAbsensiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Printer className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Pilih Format Export</h3>
                </div>
                <button
                  onClick={() => setShowAbsensiModal(false)}
                  className="text-white hover:bg-white/20 p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-indigo-100 text-sm mt-2">
                Pilih format file yang ingin diunduh untuk laporan absensi
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => handlePrintAbsensiFormat('excel')}
                  className="w-full flex items-center gap-4 p-4 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-bold text-gray-800 text-lg">Excel (.xlsx)</h4>
                    <p className="text-sm text-gray-600">Format spreadsheet untuk analisis data</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition" />
                </button>

                <button
                  onClick={() => handlePrintAbsensiFormat('pdf')}
                  className="w-full flex items-center gap-4 p-4 border-2 border-red-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
                >
                  <div className="bg-red-100 p-3 rounded-lg group-hover:bg-red-200 transition">
                    <FileText className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-bold text-gray-800 text-lg">PDF (.pdf)</h4>
                    <p className="text-sm text-gray-600">Format dokumen untuk cetak dan arsip</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowAbsensiModal(false)}
                className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showKateringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Printer className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Pilih Format Export</h3>
                </div>
                <button
                  onClick={() => setShowKateringModal(false)}
                  className="text-white hover:bg-white/20 p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-green-100 text-sm mt-2">
                Pilih format file yang ingin diunduh untuk laporan katering
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => handlePrintKateringFormat('excel')}
                  className="w-full flex items-center gap-4 p-4 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-bold text-gray-800 text-lg">Excel (.xlsx)</h4>
                    <p className="text-sm text-gray-600">Format spreadsheet untuk analisis data</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition" />
                </button>

                <button
                  onClick={() => handlePrintKateringFormat('pdf')}
                  className="w-full flex items-center gap-4 p-4 border-2 border-red-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
                >
                  <div className="bg-red-100 p-3 rounded-lg group-hover:bg-red-200 transition">
                    <FileText className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-bold text-gray-800 text-lg">PDF (.pdf)</h4>
                    <p className="text-sm text-gray-600">Format dokumen untuk cetak dan arsip</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowKateringModal(false)}
                className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <ManualInputModal 
  isOpen={showManualInput}
  kalender={selectedDate}
  onClose={() => setShowManualInput(false)} 
  onSave={handleManualSave}
  getCsrfToken={getCsrfToken}        
  fetchWithCsrf={fetchWithCsrf}      
/>


      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
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
                      <button
  onClick={() => fetchKehadiranData(selectedDate)}
  disabled={loading}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
    loading 
      ? 'bg-gray-400 cursor-not-allowed' 
      : 'bg-gray-600 hover:bg-gray-700'
  } text-white`}
>
  <svg 
    className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
    />
  </svg>
  {loading ? 'Refreshing...' : 'Refresh'}
</button>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Users className="w-4 h-4 text-indigo-100" />
                      <p className="text-indigo-100 text-sm">
                        Menampilkan {paginatedKehadiran.length} dari {filteredKehadiran.length} karyawan
                        {filteredKehadiran.length !== currentKehadiran.length && ` (Total: ${currentKehadiran.length})`}
                      </p>
                    </div>
                  </div>

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
                        key={item.id || `temp-${item.user?.id}-${idx}`} // Tambahkan fallback key yang unik
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
                          {getStatusBadge(item, `${item.id || 'new'}-${idx}`)} {/* Ubah idx jadi unique identifier */}
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