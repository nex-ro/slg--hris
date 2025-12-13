import { useState } from 'react';
import { Calendar, Users, FileText, Search, X, Check, Save, AlertCircle } from 'lucide-react';
import { Head, router } from '@inertiajs/react';
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';
function InputTidak({ users = [], flash }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDoneDate, setselectedDoneDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState(false); // TAMBAH ini

  useEffect(() => {
  if (flash?.success) {
    showToast(flash.success, 'success');
  }
  if (flash?.error) {
    showToast(flash.error, 'error');
  }
}, [flash]);

  const statusOptions = [
    { value: 'Sakit', label: 'Sakit', desc: 'Tidak Masuk kerja', color: 'bg-red-400', textColor: 'text-white', borderColor: 'border-blue-500' },
    { value: 'P1', label: 'Ijin Full Day', desc: 'Izin tidak masuk kerja seharian', color: 'bg-blue-500', textColor: 'text-white', borderColor: 'border-blue-500' },
    { value: 'P2', label: 'Ijin Setengah Hari', desc: 'Izin tidak masuk setengah hari', color: 'bg-blue-400', textColor: 'text-white', borderColor: 'border-blue-400' },
    { value: 'P3', label: 'Ijin Keluar Kantor', desc: 'Izin keluar kantor sementara', color: 'bg-blue-300', textColor: 'text-blue-900', borderColor: 'border-blue-300' },
    { value: 'C1', label: 'Cuti Full Day', desc: 'Mengambil cuti seharian penuh', color: 'bg-green-500', textColor: 'text-white', borderColor: 'border-green-500' },
    { value: 'C2', label: 'Cuti Setengah Hari', desc: 'Mengambil cuti setengah hari', color: 'bg-green-400', textColor: 'text-white', borderColor: 'border-green-400' },
    { value: 'DL', label: 'Dinas Luar', desc: 'Bertugas di luar kantor', color: 'bg-purple-500', textColor: 'text-white', borderColor: 'border-purple-500' },
    { value: 'WFH', label: 'Work From Home', desc: 'Bekerja dari rumah', color: 'bg-orange-500', textColor: 'text-white', borderColor: 'border-orange-500' },
    { value: 'FP-TR', label: 'FP Tidak Ter-Record', desc: 'Fingerprint tidak terekam sistem', color: 'bg-red-500', textColor: 'text-white', borderColor: 'border-red-500' },
    { value: 'LK', label: 'Libur Kerja', desc: 'Hari libur resmi/nasional', color: 'bg-gray-500', textColor: 'text-white', borderColor: 'border-gray-500' },
      { value: 'Marein', label: 'Marein', desc: 'Absen di Marein', color: 'bg-teal-500', textColor: 'text-white', borderColor: 'border-teal-500' },

  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.divisi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.jabatan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers);
    }
  };
  // TAMBAH setelah deklarasi state
const showToast = (message, type) => {
  const options = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  switch(type) {
    case 'success':
      toast.success(message, options);
      break;
    case 'error':
      toast.error(message, options);
      break;
    case 'warning':
      toast.warning(message, options);
      break;
    default:
      toast.info(message, options);
  }
};

 const handleSubmit = () => {
  if (!isFormValid) {
    showToast('Mohon lengkapi semua data yang diperlukan', 'warning'); // TAMBAH ini
    return;
  }
  
  if (selectedDoneDate && new Date(selectedDoneDate) < new Date(selectedDate)) {
    setDateError('Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.');
    showToast('Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.', 'error');
    return;
  } else {
    setDateError('');
  }

  setProcessing(true);
  setLoadingOverlay(true);
  
  router.post('/hrd/absen/input-tidak', {
    tanggal: selectedDate,
    tanggalSelesai: selectedDoneDate,
    status: selectedStatus,
    users: selectedUsers.map(u => u.id)
  }, {
    onSuccess: (response) => {
      setSelectedDate('');
      setselectedDoneDate('');
      setSelectedStatus('');
      setSelectedUsers([]);
      setSearchTerm('');
      setProcessing(false);
      setLoadingOverlay(false);
      
      // TAMBAH toast sukses
      showToast('Data kehadiran berhasil disimpan!', 'success');
    },
    onError: (errors) => {
      setProcessing(false);
      setLoadingOverlay(false);
      
      // TAMBAH error handling dengan toast
      let errorMessage = "Gagal menyimpan data kehadiran";
      
      if (errors.error) {
        errorMessage = errors.error;
      } else if (errors.message) {
        errorMessage = errors.message;
      } else if (typeof errors === 'object') {
        const errorArray = Object.values(errors).flat();
        errorMessage = errorArray.join(', ');
      }
      
      showToast(errorMessage, 'error');
    },
    onFinish: () => {
      setProcessing(false);
      setLoadingOverlay(false);
    }
  });
};

  const isFormValid = selectedDate && selectedStatus && selectedUsers.length > 0;

  return (
    <LayoutTemplate>
                    <Head title="Absensi" />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Input Kehadiran</h1>
                <p className="text-slate-600 mt-1">Kelola data kehadiran karyawan dengan mudah</p>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Date Selection */}
            <div className="p-8 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200">
  <div className="flex gap-8">
    {/* Tanggal Ketidakhadiran */}
    <div className="w-1/2">
      <label className="flex items-center text-sm font-bold text-slate-700 mb-3">
        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
        Tanggal Ketidakhadiran
      </label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-slate-700 font-medium"
      />
    </div>

    {/* Hingga Tanggal (Opsional) */}
    <div className="w-1/2">
      <label className="flex items-center text-sm font-bold text-slate-700 mb-3">
        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
        Hingga Tanggal (Opsional)
      </label>
      <input
        type="date"
        value={selectedDoneDate}
        onChange={(e) => setselectedDoneDate(e.target.value)}
        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-slate-700 font-medium"
      />
    </div>
  </div>
</div>


            {/* User Selection Section */}
            <div className="p-8 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Pilih Karyawan
                </h3>
                {filteredUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {selectedUsers.length === filteredUsers.length ? 'Hapus Semua' : 'Pilih Semua'}
                  </button>
                )}
              </div>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama, divisi, atau jabatan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* User List with exactly 3 visible items */}
                <div className="max-h-56 overflow-y-auto border-2 border-slate-300 rounded-xl bg-slate-50 shadow-inner">
  {filteredUsers.length > 0 ? (
    <div className="divide-y divide-slate-200">
      {filteredUsers.map((user) => {
        const isSelected = selectedUsers.find(u => u.id === user.id);
        return (
          <button
            key={user.id}
            type="button"
            onClick={() => handleUserToggle(user)}
            className={`w-full h-[20] p-4 text-left hover:bg-white transition-all flex items-center justify-between group ${
              isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:border-l-4 hover:border-slate-300'
            }`}
          >
            <div className="flex-1">
              <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {user.name}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {user.divisi} • {user.jabatan}
              </p>
            </div>
            {isSelected && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  ) : (
    <div className="p-12 text-center text-slate-500">
      <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
      <p className="font-medium">Tidak ada karyawan ditemukan</p>
      <p className="text-sm mt-1">Coba ubah kata kunci pencarian</p>
    </div>
  )}
</div>



              {/* Selected Users Display */}
              {selectedUsers.length > 0 && (
                <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      {selectedUsers.length} Karyawan Terpilih
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedUsers([])}
                      className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                    >
                      Hapus Semua
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.divisi} • {user.jabatan}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id)}
                          className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Selection Grid */}
            <div className="p-8 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Pilih Status Kehadiran</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setSelectedStatus(status.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all transform hover:scale-105 ${
                      selectedStatus === status.value
                        ? `${status.borderColor} shadow-lg scale-105`
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${status.color} ${status.textColor}`}>
                        {status.value}
                      </span>
                      {selectedStatus === status.value && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="font-semibold text-slate-800 mb-1">{status.label}</p>
                    <p className="text-xs text-slate-500">{status.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer with Submit Button */}
            {dateError && (
  <p className="mt-2 text-sm text-red-600 font-medium">{dateError}</p>
)}

            <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-blue-50 border-t-2 border-slate-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {isFormValid ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                      <span className="font-semibold">Siap untuk disimpan</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-slate-600">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">Lengkapi data berikut:</p>
                        <ul className="mt-1 space-y-1 text-xs">
                          {!selectedDate && <li>• Pilih tanggal</li>}
                          {selectedUsers.length === 0 && <li>• Pilih minimal 1 karyawan</li>}
                          {!selectedStatus && <li>• Pilih status kehadiran</li>}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isFormValid || processing}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                    isFormValid && !processing
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl transform hover:scale-105'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-5 h-5" />
                  {processing ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
          {loadingOverlay && (
      <div style={{margin:"0px", padding:"0px"}} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 mb-1">Menyimpan Data</p>
            <p className="text-sm text-gray-600">Mohon tunggu sebentar...</p>
          </div>
        </div>
      </div>
    )}

    </LayoutTemplate>
  );
}

export default InputTidak;