  import { useState, useEffect } from 'react';
  import { Head, router } from '@inertiajs/react';
  import LayoutTemplate from "@/Layouts/LayoutTemplate";
  import {
    Pencil,
    Trash2,
    Plus,
    X,
    Upload,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Users,
    UserX,
    KeyRound,
    Mail,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Send,
    Lock
  } from 'lucide-react';
  import axios from 'axios';

  function Pegawai({ flash }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // State Modal Reset Password & Kirim Email
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [selectedUserForReset, setSelectedUserForReset] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmittingReset, setIsSubmittingReset] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [users, setUsers] = useState({ data: [], links: [], total: 0, from: 0, to: 0, last_page: 1 });
    const [divisiList, setDivisiList] = useState([]);
    const [jabatanList, setJabatanList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivisi, setSelectedDivisi] = useState('');
  const [selectedJabatan, setSelectedJabatan] = useState('');
  const [selectedTower, setSelectedTower] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
    
useEffect(() => {
  fetchData(currentPage);
  
  const interval = setInterval(() => {
    fetchData(currentPage);
  }, 150000);
  
  return () => clearInterval(interval);
}, [activeTab]);

    const [formData, setFormData] = useState({
    id: '',  // ✅ TAMBAHKAN INI
    name: '',
    email: '',
    password: '',
    role: 'pegawai',
    active: true,
    tmk: '',
    divisi: '',
    jabatan: '',
    tower: '',
    keterangan: '',
    ttd: null
  });
    const [ttdPreview, setTtdPreview] = useState(null);
  // Debounced effect untuk semua filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1); // Selalu fetch dari page 1 ketika filter berubah
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [searchTerm, selectedDivisi, selectedJabatan, selectedTower]);


  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDivisi('');
    setSelectedJabatan('');
    setSelectedTower('');
    // Data akan otomatis di-fetch karena useEffect akan trigger
  };



  const fetchData = async (page = 1) => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedDivisi) params.append('divisi', selectedDivisi);
    if (selectedJabatan) params.append('jabatan', selectedJabatan);
    if (selectedTower) params.append('tower', selectedTower);
    params.append('page', page);
    params.append('status', activeTab); // ✅ TAMBAHKAN INI

    const response = await fetch(`/api/pegawai?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch data');
    
    const data = await response.json();
    setUsers(data.users);
    setDivisiList(data.divisiList || []);
    setJabatanList(data.jabatanList || []);
    setCurrentPage(page);
  } catch (error) {
    console.error('Error fetching data:', error);
    alert('Gagal memuat data. Silakan refresh halaman.');
  } finally {
    setLoading(false);
  }
};


    const resetForm = () => {
      setFormData({
        id: '',  
        name: '',
        email: '',
        password: '',
        role: 'pegawai',
        active: true,
        tmk: '',
        tanggal_keluar: '',
        divisi: '',
        jabatan: '',
        tower: '',
        keterangan: '',
        ttd: null
      });
      setTtdPreview(null);
      setIsEditing(false);
      setCurrentUser(null);
    };

    const openAddModal = () => {
      resetForm();
      setIsModalOpen(true);
    };

    const openEditModal = (user) => {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        active: user.active,
        tmk: user.tmk || '',
          tanggal_keluar: user.tanggal_keluar || '', 
        divisi: user.divisi || '',
        jabatan: user.jabatan || '',
        tower: user.tower || '',
        keterangan: user.keterangan || '',
        ttd: null
      });
      setTtdPreview(user.ttd ? `/storage/ttd/${user.ttd}` : null);
      setCurrentUser(user);
      setIsEditing(true);
      setIsModalOpen(true);
    };

    const closeModal = () => {
      setIsModalOpen(false);
      resetForm();
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'ttd' && formData[key]) {
        submitData.append('ttd', formData[key]);
      } else if (key === 'active') {
        submitData.append('active', formData[key] ? '1' : '0');
      } else if (formData[key] !== null && formData[key] !== '') {
        submitData.append(key, formData[key]);
      }
    });

    if (isEditing) {
      submitData.append('_method', 'PUT');
      router.post(`/pegawai/${currentUser.id}`, submitData, {
        onSuccess: () => {
          closeModal();
          fetchData(currentPage); 
        },
        onError: (errors) => {
          const errorMessages = Object.values(errors).flat().join('\n');
          alert('Validasi Gagal:\n\n' + errorMessages);
        },
        forceFormData: true
      });
    } else {
      router.post('/pegawai', submitData, {
        onSuccess: () => {
          closeModal();
          fetchData(1); // ✅ TAMBAHKAN INI
        },
        onError: (errors) => {
          const errorMessages = Object.values(errors).flat().join('\n');
          alert('Validasi Gagal:\n\n' + errorMessages);
        },
        forceFormData: true
      });
    }
  };

    const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) {
      router.delete(`/pegawai/${id}`, {
        onSuccess: () => {
          fetchData(currentPage); 
        }
      });
    }
  };

  const openResetPasswordModal = (user) => {
    setSelectedUserForReset(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setResetError('');
    setResetSuccess('');
    setIsResetPasswordModalOpen(true);
  };

  const closeResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false);
    setSelectedUserForReset(null);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
  };

  // Kirim link reset password ke email pegawai
  const handleSendResetEmail = async (user = selectedUserForReset) => {
    if (!user || !user.email) {
      alert('Pegawai ini belum memiliki email terdaftar.');
      return;
    }

    if (!confirm(`Kirim email link reset password ke ${user.name} (${user.email})?`)) {
      return;
    }

    setIsSendingEmail(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await axios.post(`/pegawai/${user.id}/send-reset-email`);
      if (response.data.status === 'success') {
        const msg = response.data.message || `Link reset password berhasil dikirim ke ${user.email}`;
        setResetSuccess(msg);
        alert(msg);
      } else {
        const errMsg = response.data.message || 'Gagal mengirim email reset password.';
        setResetError(errMsg);
        alert(errMsg);
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      const errMsg = error.response?.data?.message || 'Terjadi kesalahan saat mengirim email reset password.';
      setResetError(errMsg);
      alert(errMsg);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Reset password manual oleh Admin/HRD
  const handleDirectResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUserForReset) return;

    if (!newPassword || newPassword.length < 8) {
      setResetError('Password baru minimal harus 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsSubmittingReset(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await axios.post(`/pegawai/${selectedUserForReset.id}/reset-password`, {
        password: newPassword,
        password_confirmation: confirmPassword
      });

      if (response.data.status === 'success') {
        const msg = response.data.message || 'Password berhasil direset!';
        setResetSuccess(msg);
        alert(msg);
        setTimeout(() => {
          closeResetPasswordModal();
        }, 1200);
      } else {
        setResetError(response.data.message || 'Gagal mereset password.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setResetError(error.response?.data?.message || 'Terjadi kesalahan saat mereset password.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2048000) {
          alert('Ukuran file maksimal 2MB');
          e.target.value = '';
          return;
        }
        if (!file.type.startsWith('image/')) {
          alert('File harus berupa gambar');
          e.target.value = '';
          return;
        }
        setFormData(prev => ({ ...prev, ttd: file }));
        setTtdPreview(URL.createObjectURL(file));
      }
    };

    const handlePageChange = (page) => {
    fetchData(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
    const removeTtd = () => {
      setFormData(prev => ({ ...prev, ttd: null }));
      setTtdPreview(null);
    };

    const userData = users.data || [];
    const activeFilters = [searchTerm, selectedDivisi, selectedJabatan, selectedTower].filter(Boolean).length;

    return (
      <LayoutTemplate>
          <Head title="Pegawai" />
        <div className="">
        <div className="mb-6 flex justify-between items-center">
    <div className="flex items-center gap-4">
      <h1 className="text-2xl font-bold text-gray-800">Data Pegawai</h1>
      {/* ✅ TAMBAHKAN INI */}
      <button
        onClick={() => fetchData(currentPage)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
        title="Refresh data"
      >
        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        Refresh
      </button>
    </div>
    <button
      onClick={openAddModal}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      <Plus size={20} />
      Tambah Pegawai
    </button>
  </div>

          {flash?.success && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
              {flash.success}
            </div>
          )}

          {flash?.error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {flash.error}
            </div>
          )}
          {/* Tab Navigation - Updated Design */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => {
                  setActiveTab('active');
                  setCurrentPage(1);
                }}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-medium transition relative ${
                  activeTab === 'active'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users size={20} />
                <span>Pegawai Aktif</span>
                {activeTab === 'active' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                )}
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('resign');
                  setCurrentPage(1);
                }}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-medium transition relative ${
                  activeTab === 'resign'
                    ? 'text-red-600 bg-red-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserX size={20} />
                <span>Pegawai Resign</span>
                {activeTab === 'resign' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Search & Filter Section */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Cari nama atau email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition relative"
              >
                <Filter size={20} />
                Filter
                {activeFilters > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
  <select
    value={selectedDivisi}
    onChange={(e) => setSelectedDivisi(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Semua Divisi</option>
    {divisiList.map((divisi, idx) => (
      <option key={idx} value={divisi}>{divisi}</option>
    ))}
  </select>

  <select
    value={selectedJabatan}
    onChange={(e) => setSelectedJabatan(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Semua Jabatan</option>
    {jabatanList.map((jabatan, idx) => (
      <option key={idx} value={jabatan}>{jabatan}</option>
    ))}
  </select>
  <select
    value={selectedTower}
    onChange={(e) => setSelectedTower(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Semua Tower</option>
    <option value="Eiffel">Eiffel</option>
    <option value="Liberty">Liberty</option>
  </select>

                {activeFilters > 0 && (
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      onClick={resetFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading && (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TMK</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Divisi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tower</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userData.length > 0 ? userData.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.tmk || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.divisi || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-[150px] truncate" title={user.jabatan}>
                            {user.jabatan || '-'}
                          </div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.tower === 'Eiffel' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {user.tower || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openResetPasswordModal(user)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                            title="Reset Password & Kirim Email"
                          >
                            <KeyRound size={17} />
                          </button>
                          <button
                            onClick={() => handleSendResetEmail(user)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                            title="Kirim Email Reset Password"
                          >
                            <Mail size={17} />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Pegawai"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Pegawai"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                        {activeFilters > 0 ? 'Tidak ada data sesuai filter' : 'Belum ada data pegawai'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {/* Pagination */}
  {users.last_page > 1 && (
    <div className="px-6 py-4 border-t flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Menampilkan {users.from || 0} - {users.to || 0} dari {users.total} data
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ChevronLeft size={16} />
        </button>
        
        {Array.from({ length: users.last_page }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              currentPage === page
                ? 'bg-blue-600 text-white cursor-default'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === users.last_page}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            currentPage === users.last_page
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )}
          </div>

          {/* Modal Form */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {isEditing ? 'Edit Pegawai' : 'Tambah Pegawai'}
                  </h2>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <div onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID Pegawai <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        required
                        placeholder="Contoh: 101, 102, 103..."
                        disabled={isEditing} // <-- Tambahkan ini
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isEditing ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Masukkan ID unik untuk pegawai (angka)
                      </p>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password {isEditing ? '(Kosongkan jika tidak ingin mengubah)' : <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pegawai">Pegawai</option>
                        <option value="hrd">HRD</option>
                        <option value="head">Head</option>
                        <option value="Site">Site</option>
                        <option value="eksekutif">Eksekutif</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TMK(Tanggal Mulai Kerja)
                      </label>
                      <input
                        type="date"
                        name="tmk"
                        value={formData.tmk}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Keluar (Opsional)
                      </label>
                      <input
                        type="date"
                        name="tanggal_keluar"
                        value={formData.tanggal_keluar}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Isi jika pegawai sudah resign
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Divisi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="divisi"
                        value={formData.divisi}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jabatan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="jabatan"
                        value={formData.jabatan}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tower <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="tower"
                        value={formData.tower}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Pilih Tower --</option>
                        <option value="Eiffel">Eiffel</option>
                        <option value="Liberty">Liberty</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                      <textarea
                        name="keterangan"
                        value={formData.keterangan}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanda Tangan Digital
                      </label>
                      
                      {ttdPreview ? (
                        <div className="relative inline-block">
                          <img 
                            src={ttdPreview} 
                            alt="TTD Preview" 
                            className="w-48 h-32 object-contain border-2 border-gray-300 rounded-lg bg-gray-50 p-2"
                          />
                          <button
                            type="button"
                            onClick={removeTtd}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition">
                            <Upload size={18} />
                            <span className="text-sm">Upload TTD</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-gray-500">Max 2MB (JPG, PNG)</span>
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="active"
                          checked={formData.active}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Status Aktif</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      {isEditing ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Reset Password & Kirim Email */}
          {isResetPasswordModalOpen && selectedUserForReset && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-fade-in">
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                      <KeyRound size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Reset Password Pegawai</h3>
                      <p className="text-xs text-gray-500">
                        {selectedUserForReset.name} • <span className="font-mono text-gray-600">{selectedUserForReset.email || 'Tanpa Email'}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeResetPasswordModal}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Feedback Alerts */}
                {resetError && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
                    <span>{resetError}</span>
                  </div>
                )}

                {resetSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs flex items-center gap-2">
                    <Check size={16} className="flex-shrink-0 text-green-600" />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                {/* Pilihan 1: Kirim Link Reset Password via Email */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Mail size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                        Kirim Link Reset via Email
                      </h4>
                      <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                        Kirim email resmi berisi tautan reset password ke <strong className="font-semibold text-indigo-950">{selectedUserForReset.email}</strong>. Pegawai dapat mengatur sendiri kata sandi baru mereka.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendResetEmail(selectedUserForReset)}
                    disabled={isSendingEmail || !selectedUserForReset.email}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 active:scale-95"
                  >
                    <Send size={14} className={isSendingEmail ? 'animate-spin' : ''} />
                    <span>{isSendingEmail ? 'Mengirim Email...' : 'Kirim Email Reset Password Sekarang'}</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Atau Reset Manual oleh HRD
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* Pilihan 2: Reset Manual oleh HRD */}
                <form onSubmit={handleDirectResetPassword} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Password Baru <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full px-3.5 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Konfirmasi Password Baru <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeResetPasswordModal}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReset}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 active:scale-95"
                    >
                      <Lock size={14} className={isSubmittingReset ? 'animate-spin' : ''} />
                      <span>{isSubmittingReset ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </LayoutTemplate>
    );
  }

  export default Pegawai;