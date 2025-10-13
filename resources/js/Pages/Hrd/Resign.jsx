import React, { useState, useMemo } from 'react';
import { PlusCircle, Eye, Trash2, X, FileText, Search, Check, XCircle, ChevronDown } from 'lucide-react';
import { router } from '@inertiajs/react';
import LayoutTemplate from "@/Layouts/LayoutTemplate";

const Resign = ({ resigns: initialResigns = [], users: initialUsers = [] }) => {
  const [resigns, setResigns] = useState(initialResigns);
  const [users] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResign, setSelectedResign] = useState(null);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    uid: '',
    tanggal_resign: '',
    alasan: '',
    isDokument: null,
    status: 'Diproses'
  });
  
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const statusColors = {
    'Diajukan': 'bg-yellow-100 text-yellow-800',
    'Diproses': 'bg-blue-100 text-blue-800',
    'Ditolak': 'bg-red-100 text-red-800',
    'Diterima': 'bg-green-100 text-green-800'
  };

  const statusSelectColors = {
    'Diajukan': 'border-yellow-500 focus:ring-yellow-500',
    'Diproses': 'border-blue-500 focus:ring-blue-500',
    'Ditolak': 'border-red-500 focus:ring-red-500',
    'Diterima': 'border-green-500 focus:ring-green-500'
  };

  // Filter resigns based on search query
  const filteredResigns = useMemo(() => {
    if (!searchQuery.trim()) {
      return resigns;
    }
    
    const query = searchQuery.toLowerCase();
    return resigns.filter(resign => {
      const name = resign.user?.name?.toLowerCase() || '';
      const email = resign.user?.email?.toLowerCase() || '';
      return name.includes(query) || email.includes(query);
    });
  }, [resigns, searchQuery]);

  // Filter users in modal based on search query
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) {
      return users;
    }
    
    const query = userSearchQuery.toLowerCase();
    return users.filter(user => {
      const name = user.name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      return name.includes(query) || email.includes(query);
    });
  }, [users, userSearchQuery]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value) => {
    setFormData(prev => ({ 
      ...prev, 
      isDokument: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.uid || !formData.tanggal_resign || !formData.alasan || formData.isDokument === null) {
      showNotification('Semua field wajib diisi', 'error');
      return;
    }
    
    router.post('/resign', formData, {
      onSuccess: (page) => {
        // Tambahkan data baru ke state lokal
        if (page.props.resigns) {
          setResigns(page.props.resigns);
        }
        setShowModal(false);
        setFormData({
          uid: '',
          tanggal_resign: '',
          alasan: '',
          isDokument: null,
          status: 'Diproses'
        });
        showNotification('Data resign berhasil ditambahkan');
      },
      onError: (errors) => {
        showNotification(errors.message || 'Terjadi kesalahan', 'error');
      }
    });
  };

  const handleStatusChange = (id, currentStatus, action) => {
    let newStatus;
    
    if (currentStatus === 'Diajukan') {
      newStatus = action === 'terima' ? 'Diproses' : 'Ditolak';
    } else if (currentStatus === 'Diproses') {
      newStatus = action;
    } else {
      return;
    }
    
    router.put(`/resign/${id}/status`, { status: newStatus }, {
      onSuccess: () => {
        // Update state lokal agar langsung berubah
        setResigns(prevResigns => 
          prevResigns.map(resign => 
            resign.id === id ? { ...resign, status: newStatus } : resign
          )
        );
        showNotification('Status berhasil diupdate');
      },
      onError: () => {
        showNotification('Gagal mengupdate status', 'error');
      }
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus data resign ini?')) {
      router.delete(`/resign/${id}`, {
        onSuccess: () => {
          // Update state lokal agar langsung berubah
          setResigns(prevResigns => prevResigns.filter(resign => resign.id !== id));
          showNotification('Data resign berhasil dihapus');
        },
        onError: () => {
          showNotification('Gagal menghapus data', 'error');
        }
      });
    }
  };

  const handleViewDetail = (resign) => {
    setSelectedResign(resign);
    setShowDetailModal(true);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  return (
    <LayoutTemplate>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Data Resign</h1>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <PlusCircle size={20} />
              Tambah Resign
            </button>
          </div>

          {/* Notification */}
          {notification && (
            <div className={`mb-4 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {notification.message}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari nama atau email karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama Karyawan</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tanggal Efektif Berhenti</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredResigns.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data resign'}
                      </td>
                    </tr>
                  ) : (
                    filteredResigns.map((resign, index) => (
                      <tr key={resign.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{resign.user?.name || '-'}</div>
                          <div className="text-sm text-gray-500">{resign.user?.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(resign.tanggal_resign).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4">
                          {resign.status === 'Diajukan' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStatusChange(resign.id, resign.status, 'terima')}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
                              >
                                <Check size={16} />
                                Terima
                              </button>
                              <button
                                onClick={() => handleStatusChange(resign.id, resign.status, 'tolak')}
                                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
                              >
                                <XCircle size={16} />
                                Tolak
                              </button>
                            </div>
                          ) : resign.status === 'Diproses' ? (
                            <div className="relative inline-block">
                              <select
                                style={{
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    appearance: 'none',
                                    backgroundImage: 'none'
                                  }}

                                value={resign.status}
                                onChange={(e) => handleStatusChange(resign.id, resign.status, e.target.value)}
                                className={`text-sm rounded-md border-2 pl-8 pr-3 py-1 focus:outline-none focus:ring-2 appearance-none bg-white ${statusSelectColors[resign.status]}`}
                              >
                                <option value="Diproses">Diproses</option>
                                <option value="Ditolak">Ditolak</option>
                                <option value="Diterima">Diterima</option>
                              </select>
                                                            <ChevronDown className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />

                            </div>
                          ) : (
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[resign.status]}`}>
                              {resign.status}
                            </span>
                          )}
                        </td>
                      
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDetail(resign)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(resign.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-800">Tambah Resign Baru</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilih Karyawan <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        <select
                          name="uid"
                          value={formData.uid}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                          style={{ backgroundImage: 'none' }}
                        >
                          <option value="">-- Pilih Karyawan --</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} 
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Efektif Berhenti <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="tanggal_resign"
                        value={formData.tanggal_resign}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="Diproses">Diproses</option>
                          <option value="Ditolak">Ditolak</option>
                          <option value="Diterima">Diterima</option>
                        </select>
                          <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />

                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apakah Perlu Melampirkan Dokumen? <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="isDokument"
                            checked={formData.isDokument === true}
                            onChange={() => handleRadioChange(true)}
                            className="w-4 h-4 text-blue-600 cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-700">Ya, perlu dokumen</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="isDokument"
                            checked={formData.isDokument === false}
                            onChange={() => handleRadioChange(false)}
                            className="w-4 h-4 text-blue-600 cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-700">Tidak</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alasan Resign <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="alasan"
                        value={formData.alasan}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Masukkan alasan resign..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detail Modal */}
          {showDetailModal && selectedResign && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex justify-between items-center p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-800">Detail Resign</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-semibold text-gray-700">Nama Karyawan:</div>
                      <div className="col-span-2 text-gray-900">{selectedResign.user?.name || '-'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-semibold text-gray-700">Email:</div>
                      <div className="col-span-2 text-gray-900">{selectedResign.user?.email || '-'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-semibold text-gray-700">Tanggal Resign:</div>
                      <div className="col-span-2 text-gray-900">{formatDate(selectedResign.tanggal_resign)}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-semibold text-gray-700">Status:</div>
                      <div className="col-span-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[selectedResign.status]}`}>
                          {selectedResign.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-semibold text-gray-700">Alasan:</div>
                      <div className="col-span-2 text-gray-900">{selectedResign.alasan}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-semibold text-gray-700">Perlu Dokumen:</div>
                      <div className="col-span-2 text-gray-900">{selectedResign.isDokument ? 'Ya' : 'Tidak'}</div>
                    </div>
                    {selectedResign.isDokument && selectedResign.file && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-semibold text-gray-700">File Dokumen:</div>
                        <div className="col-span-2">
                          <a 
                            href={`/storage/${selectedResign.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            <FileText size={16} />
                            Lihat Dokumen
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end p-6 border-t">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutTemplate>
  );
};

export default Resign;