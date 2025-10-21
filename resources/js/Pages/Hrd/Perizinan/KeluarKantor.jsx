import { useState, useEffect } from 'react';
import {Plus, Calendar, Clock, User, FileText, Filter, CheckCircle, XCircle, Search, Check, X, Edit, Trash2, Eye, RefreshCw, Printer } from 'lucide-react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import { usePage, router, Head } from '@inertiajs/react'; // Tambahkan router

function KeluarKantor() {
  const [perizinans, setPerizinans] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedPerizinan, setSelectedPerizinan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [heads, setHeads] = useState([]);
  const { auth } = usePage().props;
  const currentUser = auth?.user || auth; 
  

  const [formData, setFormData] = useState({
  uid: '',
  uid_diketahui: '',
  type_perizinan: '',
  tanggal: '',
  jam_keluar: '',
  jam_kembali: '',
  keperluan: ''
});

const [formErrors, setFormErrors] = useState({});
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    diajukan: 0,
    disetujui: 0,
    ditolak: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    tanggal: ''
  });
  const isAuthorizedHead = (item) => {
  if (!currentUser) return false;
  return currentUser.id === item.uid_diketahui && item.status_diketahui === null;
};

// Helper function untuk cek apakah user adalah HRD - PERBAIKI INI
const isAuthorizedHRD = (item) => {
  if (!currentUser) return false;
  const isHRD = currentUser.role === 'hrd' && currentUser.role != 'head'
  
  // PERBAIKAN: HRD bisa approve jika status_disetujui masih null DAN status_diketahui sudah disetujui
  return isHRD && 
         item.status_diketahui === 'Disetujui' && 
         item.status_disetujui === null;
};

const handlePrint = async (id) => {
  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    if (!csrfToken) {
      throw new Error('CSRF token tidak ditemukan');
    }

    window.open(`/izin/${id}/pdf`, '_blank');
    
  } catch (error) {
    console.error('Error printing perizinan:', error);
    alert('Gagal generate PDF: ' + error.message);
  }
};
// Helper function untuk cek apakah bisa menampilkan tombol aksi
const canShowActionButtons = (item) => {
  return isAuthorizedHead(item) || isAuthorizedHRD(item);
};

// Helper function untuk mendapatkan label tombol
const getApprovalLabel = (item) => {
  if (isAuthorizedHead(item)) {
    return 'Terima';
  } else if (isAuthorizedHRD(item)) {
    return 'Setujui';
  }
  return 'Terima';
};


  const getStatusIcon = (status) => {
  if (status === 'Disetujui') {
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  } else if (status === 'Ditolak') {
    return <XCircle className="w-5 h-5 text-red-600" />;
  } else {
    return <span className="text-gray-400">-</span>;
  }
  };

  // Fetch users dan heads untuk dropdown
const fetchUsersAndHeads = async () => {
  try {
    const [usersRes, headsRes] = await Promise.all([
      fetch('/api/userss', { credentials: 'include' }),
      fetch('/api/heads', { credentials: 'include' })
    ]);
    
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      setUsers(usersData.data || usersData);
    }
    
    if (headsRes.ok) {
      const headsData = await headsRes.json();
      setHeads(headsData.data || headsData);
    }
  } catch (error) {
    console.error('Error fetching users/heads:', error);
  }
};

useEffect(() => {
  fetchUsersAndHeads();
}, []);

// Reset form
const resetForm = () => {
  setFormData({
    uid: '',
    uid_diketahui: '',
    type_perizinan: '',
    tanggal: '',
    jam_keluar: '',
    jam_kembali: '',
    keperluan: ''
  });
  setFormErrors({});
};

// Handle form change
const handleFormChange = (field, value) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
  
  // Clear error untuk field yang diubah
  if (formErrors[field]) {
    setFormErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  }
};

// Validate form
const validateForm = () => {
  const errors = {};
  
  if (!formData.uid) errors.uid = 'Karyawan harus dipilih';
  if (!formData.uid_diketahui) errors.uid_diketahui = 'Head yang mengetahui harus dipilih';
  if (!formData.type_perizinan) errors.type_perizinan = 'Tipe perizinan harus dipilih';
  if (!formData.tanggal) errors.tanggal = 'Tanggal harus diisi';
  if (!formData.keperluan) errors.keperluan = 'Keperluan harus diisi';
  
  // Validasi jam untuk type p2 dan p3
  if (formData.type_perizinan === 'p2' || formData.type_perizinan === 'p3') {
    if (!formData.jam_keluar) errors.jam_keluar = 'Jam keluar harus diisi';
    if (!formData.jam_kembali) errors.jam_kembali = 'Jam kembali harus diisi';
    
    if (formData.jam_keluar && formData.jam_kembali) {
      if (formData.jam_keluar >= formData.jam_kembali) {
        errors.jam_kembali = 'Jam kembali harus lebih dari jam keluar';
      }
    }
  }
  
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};

// Tambahkan helper function untuk fresh CSRF token
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

// Ubah getCsrfToken menjadi arrow function biasa
const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

// Ganti handleSubmit dengan ini:
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  setLoading(true);
  
  try {
    const submitData = { ...formData };
    
    if (formData.type_perizinan === 'p1') {
      submitData.jam_keluar = '00:00';
      submitData.jam_kembali = '00:00';
    }
    
    let csrfToken = getCsrfToken();
    
    const response = await fetch('/hrd/perizinan/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(submitData)
    });

    // Handle CSRF token mismatch (419)
    if (response.status === 419) {
      const newToken = await fetchFreshCsrfToken();
      
      if (!newToken) {
        throw new Error('Gagal mendapatkan CSRF token baru. Silakan refresh halaman.');
      }

      // Retry dengan token baru
      const retryResponse = await fetch('/hrd/perizinan/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': newToken,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(submitData)
      });

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        if (errorData.errors) {
          setFormErrors(errorData.errors);
        }
        throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
      }

      const result = await retryResponse.json();
      
      if (result.success) {
        alert('Perizinan berhasil ditambahkan!');
        setShowAddModal(false);
        resetForm();
        fetchPerizinans();
      }
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.errors) {
        setFormErrors(errorData.errors);
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      alert('Perizinan berhasil ditambahkan!');
      setShowAddModal(false);
      resetForm();
      fetchPerizinans();
    }
  } catch (error) {
    console.error('Error adding perizinan:', error);
    if (error.message.includes('419') || error.message.includes('CSRF')) {
      alert('Session Anda telah berakhir. Halaman akan di-refresh untuk memperbarui session.');
      window.location.reload();
    } else {
      alert('Gagal menambahkan perizinan: ' + error.message);
    }
  } finally {
    setLoading(false);
  }
};
  const getStatusDisplay = (status) => {
  if (status === 'Disetujui') {
    return (
      <div className="flex items-center gap-1.5 text-green-700">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Disetujui</span>
      </div>
    );
  } else if (status === 'Ditolak') {
    return (
      <div className="flex items-center gap-1.5 text-red-700">
        <XCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Ditolak</span>
      </div>
    );
  } else {
    return <span className="text-sm text-gray-400">-</span>;
  }
};


  // Hitung filter aktif
  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const getTypeLabel = (type) => {
    const types = {
    'p1': 'P1',
    'p2': 'P2',
    'p3': 'P3'
    };

    return types[type] || type;
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      type: '',
      tanggal: ''
    });
  };

  const fetchPerizinans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      if (filters.tanggal) params.append('tanggal', filters.tanggal);

      const response = await fetch(`/hrd/perizinan?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Gagal mengambil data');

      const result = await response.json();

      if (result && result.perizinans) {
        const data = result.perizinans.data || result.perizinans;
        setPerizinans(data);
        setFilteredData(data);
        
        if (result.stats) {
          setStats(result.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching perizinans:', error);
      alert('Gagal mengambil data perizinan');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch ketika filter berubah
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPerizinans();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.type, filters.tanggal]);

  // Initial fetch
  useEffect(() => {
    fetchPerizinans();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      'Diajukan': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Disetujui': 'bg-green-100 text-green-800 border-green-300',
      'Ditolak': 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const handleApprove = (perizinan) => {
    setSelectedPerizinan(perizinan);
    setShowApprovalModal(true);
    setApprovalAction('approve');
    setApprovalNote('');
  };

  const handleReject = (perizinan) => {
    setSelectedPerizinan(perizinan);
    setShowRejectModal(true);
  };



// Ganti confirmApproval
const confirmApproval = () => {
  router.post(`/hrd/perizinan/${selectedPerizinan.id}/approve`, {
    catatan: approvalNote
  }, {
    preserveState: false,
    preserveScroll: false,
    onSuccess: () => {
      const message = isAuthorizedHead(selectedPerizinan) 
        ? 'Perizinan berhasil diketahui!' 
        : 'Perizinan berhasil disetujui!';
      alert(message);
      setShowApprovalModal(false);
      setSelectedPerizinan(null);
      setApprovalNote('');
    },
    onError: (errors) => {
      console.error('Error approving perizinan:', errors);
      alert('Gagal menyetujui perizinan');
    }
  });
};

// Ganti confirmReject
const confirmReject = () => {
  if (!rejectReason.trim()) {
    alert('Catatan penolakan harus diisi');
    return;
  }

  router.post(`/hrd/perizinan/${selectedPerizinan.id}/reject`, {
    catatan: rejectReason
  }, {
    preserveState: false,
    preserveScroll: false,
    onSuccess: () => {
      alert('Perizinan berhasil ditolak');
      setShowRejectModal(false);
      setSelectedPerizinan(null);
      setRejectReason('');
    },
    onError: (errors) => {
      console.error('Error rejecting perizinan:', errors);
      alert('Gagal menolak perizinan');
    }
  });
};

  const handleDelete = async (id) => {
  if (!confirm('Apakah Anda yakin ingin menghapus data perizinan ini?')) {
    return;
  }

  try {
    // PERBAIKAN: Ambil CSRF token dengan benar
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    if (!csrfToken) {
      throw new Error('CSRF token tidak ditemukan');
    }
    
    const response = await fetch(`/perizinan/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest' // Tambahkan ini
      },
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Gagal menghapus perizinan');

    alert('Data perizinan berhasil dihapus');
    fetchPerizinans();
  } catch (error) {
    console.error('Error deleting perizinan:', error);
    alert('Gagal menghapus perizinan: ' + error.message);
  }
};

  return (
    <LayoutTemplate>
        <Head title="Perizinan Keluar Kantor" />
        <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Kelola Perizinan</h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Perizinan
          </button>
        </div>

{/* Search & Filter Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="p-4">
            {/* Search Bar & Filter Button */}
            <div className="flex gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan atau jabatan..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors relative ${
                  showFilterDropdown 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span className="font-medium">Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Dropdown - Muncul ketika tombol diklik */}
            {showFilterDropdown && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  {/* Filter Status */}
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer text-sm"
                    >
                      <option value="">Semua Status</option>
                      <option value="Diajukan">Diajukan</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>
                  </div>

                  {/* Filter Tipe Perizinan */}
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Tipe Izin
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({...filters, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer text-sm"
                    >
                      <option value="">Semua Tipe Izin</option>
                      <option value="p1">Izin Seharian(P1)</option>
                      <option value="p2">Izin Setengah Hari (P2)</option>
                      <option value="p3">Izin Keluar Sementara(P3)</option>
                    </select>
                  </div>

                  {/* Filter Tanggal */}
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Tanggal
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        value={filters.tanggal}
                        onChange={(e) => setFilters({...filters, tanggal: e.target.value})}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer text-sm"
                      />
                    </div>
                  </div>

                  {/* Reset Button */}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500 self-center">Filter aktif:</span>
                {filters.status && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Status: {filters.status}
                    <button onClick={() => setFilters({...filters, status: ''})} className="hover:bg-blue-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.type && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Tipe: {filters.type === 'p1' ? 'Seharian' : filters.type === 'p2' ? 'Keluar Kantor' : 'Datang Terlambat'}
                    <button onClick={() => setFilters({...filters, type: ''})} className="hover:bg-blue-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.tanggal && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Tanggal: {new Date(filters.tanggal).toLocaleDateString('id-ID')}
                    <button onClick={() => setFilters({...filters, tanggal: ''})} className="hover:bg-blue-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

  {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Memuat data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Karyawan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe Izin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Diketahui
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Disetujui
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        Tidak ada data perizinan
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-gray-900">{item.user?.name || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{getTypeLabel(item.type_perizinan)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(item.tanggal).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.type_perizinan === 'p1' ? (
                            <span className="text-sm text-gray-500">Seharian</span>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {item.jam_keluar} - {item.jam_kembali}
                            </div>
                          )}
                        </td>
                        {/* Kolom Status Diketahui - BARU */}
                        <td className="px-6 py-4">
                          {getStatusDisplay(item.status_diketahui)}
                        </td>
                        {/* Kolom Status Disetujui - BARU */}
                        <td className="px-6 py-4">
                          {getStatusDisplay(item.status_disetujui)}
                        </td>
                        {/* Kolom Status Keseluruhan */}
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                           
                          
                            {/* Tombol Aksi - hanya tampil jika status masih bisa diproses */}
                           {/* Ganti kondisi lama dengan yang baru */}
{canShowActionButtons(item) && (
  <div className="flex items-center gap-2">
    <button
      onClick={() => handleApprove(item)}
      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center gap-1"
      title={getApprovalLabel(item)}
    >
      <Check className="w-3.5 h-3.5" />
      {getApprovalLabel(item)}
    </button>
    <button
      onClick={() => handleReject(item)}
      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-1"
      title="Tolak"
    >
      <X className="w-3.5 h-3.5" />
      Tolak
    </button>
  </div>
)}
                
                             <button
                              onClick={() => {
                                setSelectedPerizinan(item);
                                setShowDetailModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                                <button
                                  onClick={() => handlePrint(item.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Print PDF"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>

                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedPerizinan && (
            
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Detail Perizinan</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
  <div>
    <label className="text-sm font-medium text-gray-500">Nama Karyawan</label>
    <p className="mt-1 text-gray-900">{selectedPerizinan.user.name}</p>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-500">Jabatan</label>
    <p className="mt-1 text-gray-900">{selectedPerizinan.user.jabatan}</p>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-500">Email</label>
    <p className="mt-1 text-gray-900">{selectedPerizinan.user.email}</p>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-500">Tipe Perizinan</label>
    <p className="mt-1 text-gray-900">{getTypeLabel(selectedPerizinan.type_perizinan)}</p>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-500">Tanggal</label>
    <p className="mt-1 text-gray-900">
      {new Date(selectedPerizinan.tanggal).toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
    </p>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-500">Waktu</label>
    <p className="mt-1 text-gray-900">
      {selectedPerizinan.type_perizinan === 'p1' 
        ? 'Seharian' 
        : `${selectedPerizinan.jam_keluar} - ${selectedPerizinan.jam_kembali}`
      }
    </p>
  </div>
  
  {/* Status Diketahui - BARU */}
  <div>
    <label className="text-sm font-medium text-gray-500">Status Diketahui</label>
    <div className="mt-1">
      {getStatusDisplay(selectedPerizinan.status_diketahui)}
    </div>
  </div>
  
  {/* Status Disetujui - BARU */}
  <div>
    <label className="text-sm font-medium text-gray-500">Status Disetujui</label>
    <div className="mt-1">
      {getStatusDisplay(selectedPerizinan.status_disetujui)}
    </div>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-500">Diketahui Oleh</label>
    <p className="mt-1 text-gray-900">{selectedPerizinan?.diketahui_oleh?.name || "-"}</p>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-500">Disetujui Oleh</label>
    <p className="mt-1 text-gray-900">{selectedPerizinan?.disetujuiOleh?.name || "Tim HRD"}</p>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-500">Status Keseluruhan</label>
    <p className="mt-1">
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(selectedPerizinan.status)}`}>
        {selectedPerizinan.status}
      </span>
    </p>
  </div>
  
</div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Keperluan</label>
                  <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedPerizinan.keperluan}
                  </p>
                </div>
                {selectedPerizinan.catatan && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Catatan</label>
                    <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                      {selectedPerizinan.catatan}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
  <button
    onClick={() => setShowDetailModal(false)}
    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
  >
    Tutup
  </button>
  {/* Hanya tampil jika masih bisa diproses */}
    {/* Di bagian bawah detail modal, ganti kondisi */}
{canShowActionButtons(selectedPerizinan) && (
  <>
    <button
      onClick={() => {
        setShowDetailModal(false);
        handleReject(selectedPerizinan);
      }}
      className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
    >
      <X className="w-4 h-4" />
      Tolak
    </button>
    <button
      onClick={() => {
        setShowDetailModal(false);
        handleApprove(selectedPerizinan);
      }}
      className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
    >
      <Check className="w-4 h-4" />
      {getApprovalLabel(selectedPerizinan)}
    </button>
  </>
)}
</div>
            </div>
          </div>
        )}

        {/* Approval Modal */}
{showApprovalModal && selectedPerizinan && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-md w-full">
      <div className="p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Setujui Perizinan
        </h3>
        <p className="text-gray-600 text-center mb-4">
          Apakah Anda yakin ingin menyetujui pengajuan izin dari <strong>{selectedPerizinan.user?.name}</strong>?
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan (Opsional)
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows="3"
            placeholder="Tambahkan catatan jika diperlukan..."
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowApprovalModal(false);
              setApprovalNote('');
            }}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={confirmApproval}
            className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Ya, Setujui
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Reject Modal */}
    {showRejectModal && selectedPerizinan && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-md w-full">
      <div className="p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <X className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Tolak Perizinan
        </h3>
        <p className="text-gray-600 text-center mb-4">
          Berikan catatan penolakan untuk <strong>{selectedPerizinan.user?.name}</strong>
        </p>
        <textarea
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
          rows="4"
          placeholder="Masukkan catatan penolakan..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowRejectModal(false);
              setRejectReason('');
            }}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={confirmReject}
            disabled={!rejectReason.trim()}
            className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tolak
          </button>
        </div>
      </div>
    </div>
  </div>
    )}      
{/* Add Modal */}
    {showAddModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Tambah Perizinan Baru</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
            
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Pilih Karyawan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Karyawan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.uid}
                onChange={(e) => handleFormChange('uid', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  formErrors.uid ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Karyawan</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.jabatan}
                  </option>
                ))}
              </select>
              {formErrors.uid && (
                <p className="mt-1 text-sm text-red-600">{formErrors.uid}</p>
              )}
            </div>

            {/* Pilih Head yang Mengetahui */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diketahui Oleh (Head) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.uid_diketahui}
                onChange={(e) => handleFormChange('uid_diketahui', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  formErrors.uid_diketahui ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Head</option>
                {heads.map(head => (
                  <option key={head.id} value={head.id}>
                    {head.name} - {head.jabatan}
                  </option>
                ))}
              </select>
              {formErrors.uid_diketahui && (
                <p className="mt-1 text-sm text-red-600">{formErrors.uid_diketahui}</p>
              )}
            </div>

            {/* Tipe Perizinan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Perizinan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type_perizinan}
                onChange={(e) => handleFormChange('type_perizinan', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  formErrors.type_perizinan ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Tipe Perizinan</option>
                <option value="p1">Izin Seharian (P1)</option>
                <option value="p2">Izin Setengah Hari (P2)</option>
                <option value="p3">Izin Keluar Sementara (P3)</option>
              </select>
              {formErrors.type_perizinan && (
                <p className="mt-1 text-sm text-red-600">{formErrors.type_perizinan}</p>
              )}
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => handleFormChange('tanggal', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  formErrors.tanggal ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.tanggal && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tanggal}</p>
              )}
            </div>

            {/* Jam Keluar & Kembali - hanya tampil untuk p2 dan p3 */}
            {(formData.type_perizinan === 'p2' || formData.type_perizinan === 'p3') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Keluar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.jam_keluar}
                    onChange={(e) => handleFormChange('jam_keluar', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      formErrors.jam_keluar ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.jam_keluar && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.jam_keluar}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Kembali <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.jam_kembali}
                    onChange={(e) => handleFormChange('jam_kembali', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      formErrors.jam_kembali ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.jam_kembali && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.jam_kembali}</p>
                  )}
                </div>
              </div>
            )}

            {/* Keperluan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keperluan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.keperluan}
                onChange={(e) => handleFormChange('keperluan', e.target.value)}
                rows="4"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none ${
                  formErrors.keperluan ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between mt-1">
                {formErrors.keperluan ? (
                  <p className="text-sm text-red-600">{formErrors.keperluan}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {formData.keperluan.length} / 1000 karakter
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perizinan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

</div>
    </div>
    </LayoutTemplate>
  );
}

export default KeluarKantor;