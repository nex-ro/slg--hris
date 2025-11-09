import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
function formatDateLocal(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // bulan 0-11
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


function ManualInputModal({ isOpen, kalender, onClose, onSave, getCsrfToken, fetchWithCsrf }) {
  const [formData, setFormData] = useState({
    tanggal: '',
    userId: '',
    status: '',
    jam_kedatangan: '',
    jam_pulang: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  const userDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  
useEffect(() => {
  if (isOpen && kalender) {
    const dateObj = new Date(kalender);
    const formatted = formatDateLocal(dateObj); 
    setFormData(prev => ({
      ...prev,
      tanggal: formatted
    }));
  }
}, [isOpen, kalender]);


  const statusOptions = [
    { value: 'Hadir', label: 'Hadir', desc: 'Hadir bekerja normal', color: 'bg-green-500', textColor: 'text-white', borderColor: 'border-green-500', requireTime: true },
    { value: 'Sakit', label: 'Sakit', desc: 'Tidak Masuk kerja', color: 'bg-red-400', textColor: 'text-white', borderColor: 'border-red-400' },
    { value: 'P1', label: 'Ijin Full Day', desc: 'Izin tidak masuk kerja seharian', color: 'bg-blue-500', textColor: 'text-white', borderColor: 'border-blue-500' },
    { value: 'P2', label: 'Ijin Setengah Hari', desc: 'Izin tidak masuk setengah hari', color: 'bg-blue-400', textColor: 'text-white', borderColor: 'border-blue-400' },
    { value: 'P3', label: 'Ijin Keluar Kantor', desc: 'Izin keluar kantor sementara', color: 'bg-blue-300', textColor: 'text-blue-900', borderColor: 'border-blue-300' },
    { value: 'C1', label: 'Cuti Full Day', desc: 'Mengambil cuti seharian penuh', color: 'bg-green-500', textColor: 'text-white', borderColor: 'border-green-500' },
    { value: 'C2', label: 'Cuti Setengah Hari', desc: 'Mengambil cuti setengah hari', color: 'bg-green-400', textColor: 'text-white', borderColor: 'border-green-400' },
    { value: 'DL', label: 'Dinas Luar', desc: 'Bertugas di luar kantor', color: 'bg-purple-500', textColor: 'text-white', borderColor: 'border-purple-500' },
    { value: 'WFH', label: 'Work From Home', desc: 'Bekerja dari rumah', color: 'bg-orange-500', textColor: 'text-white', borderColor: 'border-orange-500' },
    { value: 'FP-TR', label: 'FP Tidak Ter-Record', desc: 'Fingerprint tidak terekam sistem', color: 'bg-red-500', textColor: 'text-white', borderColor: 'border-red-500' },
    { value: 'LK', label: 'Libur Kerja', desc: 'Hari libur resmi/nasional', color: 'bg-gray-500', textColor: 'text-white', borderColor: 'border-gray-500' },
  ];

  // Fetch users dari backend
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Gagal memuat data users');
    } finally {
      setLoadingUsers(false);
    }
  };
  const selectedStatus = statusOptions.find(opt => opt.value === formData.status);
  const selectedUser = users.find(user => user.id === formData.userId);
  
  
  // Filter users berdasarkan pencarian
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.id.toString().includes(searchUser)
  );

  const handleSubmit = async () => {
  // Validasi
  if (!formData.tanggal || !formData.userId || !formData.status) {
    alert('Harap isi Tanggal, Nama Karyawan, dan Status');
    return;
  }

  if (formData.status === 'Hadir' && !formData.jam_kedatangan) {
    alert('Jam Kedatangan wajib diisi untuk status Hadir');
    return;
  }

  setSubmitting(true);

  try {
    // Gunakan fetchWithCsrf dari parent
    const response = await fetchWithCsrf('/kehadiran/manual', {
      method: 'POST',
      body: JSON.stringify({
        tanggal: formData.tanggal,
        user_id: formData.userId,
        status: formData.status,
        jam_kedatangan: formData.jam_kedatangan || null,
        jam_pulang: formData.jam_pulang || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal menyimpan data');
    }

    const result = await response.json();

    // Reset form
    setFormData({
      tanggal: '',
      userId: '',
      status: '',
      jam_kedatangan: '',
      jam_pulang: ''
    });
    setSearchUser('');
    
    alert('Data berhasil disimpan!');
    
    // Tutup modal
    onClose();
    
    // Refresh data
    if (onSave) {
      onSave(result.data);
    }

  } catch (error) {
    console.error('Error saving data:', error);
    
    if (error.message.includes('CSRF') || error.message.includes('419')) {
      alert('Session Anda telah berakhir. Halaman akan di-refresh untuk memperbarui session.');
      window.location.reload();
    } else {
      alert(error.message || 'Terjadi kesalahan saat menyimpan data');
    }
  } finally {
    setSubmitting(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] flex flex-col" style={{ zIndex: 10000 }}>
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Tambah Data Kehadiran Manual</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 pb-12">
          <div className="space-y-4">
            {/* Tanggal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            {/* Nama Karyawan */}
            <div ref={userDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Karyawan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowStatusDropdown(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-all"
                >
                  <span className={selectedUser ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedUser ? `${selectedUser.name} (ID: ${selectedUser.id})` : 'Pilih Karyawan'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserDropdown && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg" style={{ zIndex: 10001 }}>
                    {/* Search Box */}
                    <div className="p-3 border-b bg-gray-50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cari nama atau ID..."
                          value={searchUser}
                          onChange={(e) => setSearchUser(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    
                    {/* User List - Show only 2 items, rest scrollable */}
                    <div className="max-h-[140px] overflow-y-auto">
                      {loadingUsers ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-sm">Loading...</p>
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p className="text-sm">Tidak ada data ditemukan</p>
                        </div>
                      ) : (
                        filteredUsers.map(user => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, userId: user.id});
                              setShowUserDropdown(false);
                              setSearchUser('');
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0 group"
                          >
                            <div className="font-medium text-gray-900 group-hover:text-blue-700">{user.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">ID: {user.id}</span>
                              {user.divisi && <span className="ml-2">{user.divisi}</span>}
                              {user.jabatan && <span className="ml-1">• {user.jabatan}</span>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div ref={statusDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Kehadiran <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-all"
                >
                  {selectedStatus ? (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${selectedStatus.color} ${selectedStatus.textColor}`}>
                        {selectedStatus.label}
                      </span>
                      <span className="text-sm text-gray-500">{selectedStatus.desc}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Pilih Status</span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showStatusDropdown && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-[160px] overflow-y-auto" style={{ zIndex: 10001 }}>
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setShowStatusDropdown(false);
                          // Reset jam jika bukan status Hadir
                          if (option.value !== 'Hadir') {
                            setFormData(prev => ({...prev, status: option.value, jam_kedatangan: '', jam_pulang: ''}));
                          } else {
                            setFormData(prev => ({...prev, status: option.value}));
                          }
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0 group"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`px-2.5 py-1 rounded text-xs font-medium ${option.color} ${option.textColor} whitespace-nowrap`}>
                            {option.label}
                          </span>
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 flex-1">{option.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Jam Kedatangan dan Pulang - hanya tampil jika status Hadir */}
            {formData.status === 'Hadir' && (
              <div className="space-y-4 pt-2 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jam Kedatangan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.jam_kedatangan}
                    onChange={(e) => setFormData({...formData, jam_kedatangan: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jam Pulang <span className="text-gray-400 text-xs font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="time"
                    value={formData.jam_pulang}
                    onChange={(e) => setFormData({...formData, jam_pulang: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer - Fixed */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-white hover:border-gray-400 font-medium transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-all shadow-sm hover:shadow"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManualInputModal;