import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Calculator, CheckCircle, XCircle, Eye, Clock, User } from 'lucide-react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';

function Cuti({ jatahCuti, users, tahunList, filters = {}, pemakaianCuti = [], auth }) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedData, setSelectedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [selectedTahun, setSelectedTahun] = useState(filters?.tahun || '');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCuti, setSelectedCuti] = useState(null);
  const [activeTab, setActiveTab] = useState('jatah'); // 'jatah' or 'pengajuan'
  
  const [formData, setFormData] = useState({
    uid: '',
    tahun_ke: '',
    tahun: new Date().getFullYear(),
    jumlah_cuti: '',
    keterangan: '',
    sisa_cuti: '',
    cuti_dipakai: ''
  });

  const currentUserId = auth?.user?.id;

  const handleSearch = (value) => {
    setSearchTerm(value);
    router.get(route('hrd.cuti.index'), { 
      search: value, 
      tahun: selectedTahun 
    }, { 
      preserveState: true 
    });
  };

  const handleTahunFilter = (value) => {
    setSelectedTahun(value);
    router.get(route('hrd.cuti.index'), { 
      search: searchTerm, 
      tahun: value 
    }, { 
      preserveState: true 
    });
  };

  const openModal = (type, data = null) => {
    setModalType(type);
    if (type === 'edit' && data) {
      setSelectedData(data);
      setFormData({
        uid: data.uid,
        tahun_ke: data.tahun_ke,
        tahun: data.tahun,
        jumlah_cuti: data.jumlah_cuti,
        keterangan: data.keterangan || '',
        sisa_cuti: data.sisa_cuti,
        cuti_dipakai: data.cuti_dipakai
      });
    } else {
      setFormData({
        uid: '',
        tahun_ke: '',
        tahun: new Date().getFullYear(),
        jumlah_cuti: '',
        keterangan: '',
        sisa_cuti: '',
        cuti_dipakai: '0'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedData(null);
  };

  const calculateCuti = async () => {
    if (!formData.uid || !formData.tahun) {
      alert('Pilih user dan tahun terlebih dahulu');
      return;
    }

    try {
      const response = await fetch(route('hrd.cuti.calculate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          uid: formData.uid,
          tahun: formData.tahun
        })
      });

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        tahun_ke: data.tahun_ke,
        jumlah_cuti: data.jumlah_cuti,
        sisa_cuti: data.jumlah_cuti,
        cuti_dipakai: 0
      }));
    } catch (error) {
      console.error('Error calculating cuti:', error);
    }
  };

  const handleSubmit = () => {
    if (modalType === 'create') {
      router.post(route('hrd.cuti.store'), formData, {
        onSuccess: () => closeModal()
      });
    } else {
      router.put(route('hrd.cuti.update', selectedData.id), formData, {
        onSuccess: () => closeModal()
      });
    }
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      router.delete(route('hrd.cuti.destroy', id));
    }
  };

  const handleApproval = (cutiId, approvalType, status) => {
    if (!confirm(`Apakah Anda yakin ingin ${status === 'disetujui' ? 'menyetujui' : 'menolak'} pengajuan cuti ini?`)) {
      return;
    }

    router.post(route('hrd.cuti.approval'), {
      pemakaian_cuti_id: cutiId,
      approval_type: approvalType, // 'atasan', 'hrd', atau 'pimpinan'
      status: status, // 'disetujui' atau 'ditolak'
    }, {
      onSuccess: () => {
        setShowDetailModal(false);
        setSelectedCuti(null);
      }
    });
  };

  
  const getStatusBadge = (status) => {
    const statusConfig = {
      'diproses': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
      'disetujui': { bg: 'bg-green-100', text: 'text-green-800', label: 'Disetujui' },
      'ditolak': { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' }
    };
    const config = statusConfig[status] || statusConfig['diproses'];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Update fungsi canApprove untuk cek status_final
  const canApproveAsAtasan = (cuti) => {
    return cuti.diketahui_atasan === currentUserId && 
           cuti.status_diketahui_atasan === 'diproses' &&
           cuti.status_final === 'diproses'; // ✅ TAMBAH CEK INI
  };

  const canApproveAsHRD = (cuti) => {
    return cuti.diketahui_hrd === currentUserId && 
           cuti.status_diketahui_hrd === 'diproses' &&
           cuti.status_final === 'diproses'; // ✅ TAMBAH CEK INI
  };

  const canApproveAsPimpinan = (cuti) => {
    return cuti.disetujui === currentUserId && 
           cuti.status_disetujui === 'diproses' &&
           cuti.status_final === 'diproses'; // ✅ TAMBAH CEK INI
  };

  // Tambahkan fungsi untuk badge status final
  const getStatusFinalBadge = (statusFinal) => {
    const config = {
      'diproses': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu Persetujuan', icon: Clock },
      'disetujui': { bg: 'bg-green-100', text: 'text-green-800', label: 'Disetujui', icon: CheckCircle },
      'ditolak': { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak', icon: XCircle }
    };
    const item = config[statusFinal] || config['diproses'];
    const Icon = item.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${item.bg}`}>
        <Icon className={`w-5 h-5 ${item.text}`} />
        <span className={`font-semibold ${item.text}`}>{item.label}</span>
      </div>
    );
  };
  const openDetailModal = (cuti) => {
    setSelectedCuti(cuti);
    setShowDetailModal(true);
  };

  return (
    <LayoutTemplate>
      <div className="">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Manajemen Cuti Karyawan</h1>
          <p className="text-gray-600">Kelola jatah cuti dan persetujuan cuti karyawan</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('jatah')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'jatah'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Jatah Cuti
            </button>
            <button
              onClick={() => setActiveTab('pengajuan')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'pengajuan'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pengajuan Cuti
            </button>
          </div>
        </div>

        {/* Tab Content: Jatah Cuti */}
        {activeTab === 'jatah' && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama karyawan..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedTahun}
                  onChange={(e) => handleTahunFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Tahun</option>
                  {tahunList.map((tahun) => (
                    <option key={tahun} value={tahun}>{tahun}</option>
                  ))}
                </select>

                <button
                  onClick={() => openModal('create')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Jatah Cuti
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Karyawan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun Ke</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jatah Cuti</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuti Dipakai</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sisa Cuti</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jatahCuti.data.length > 0 ? (
                      jatahCuti.data.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {jatahCuti.from + index}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.user?.name}</div>
                            <div className="text-sm text-gray-500">{item.user?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tahun}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tahun_ke}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.jumlah_cuti} hari</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{item.cuti_dipakai} hari</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{item.sisa_cuti} hari</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.keterangan || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openModal('edit', item)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                          Tidak ada data jatah cuti
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {jatahCuti.last_page > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Menampilkan {jatahCuti.from} - {jatahCuti.to} dari {jatahCuti.total} data
                  </div>
                  <div className="flex gap-2">
                    {jatahCuti.links.map((link, index) => (
                      <button
                        key={index}
                        onClick={() => link.url && router.visit(link.url)}
                        disabled={!link.url}
                        className={`px-3 py-1 text-sm rounded ${
                          link.active
                            ? 'bg-blue-600 text-white'
                            : link.url
                            ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab Content: Pengajuan Cuti */}
        {activeTab === 'pengajuan' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode Cuti</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Atasan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status HRD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Pimpinan</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pemakaianCuti && pemakaianCuti.length > 0 ? (
                    pemakaianCuti.map((cuti, index) => (
                      <tr key={cuti.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cuti.user?.name}</div>
                          <div className="text-sm text-gray-500">{formatDate(cuti.tanggal_pengajuan)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(cuti.tanggal_mulai)} - {formatDate(cuti.tanggal_selesai)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {cuti.jumlah_hari} hari
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {cuti.status_diketahui_atasan ? getStatusBadge(cuti.status_diketahui_atasan) : '-'}
                            {canApproveAsAtasan(cuti) && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleApproval(cuti.id, 'atasan', 'disetujui')}
                                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                  title="Setujui"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Setuju
                                </button>
                                <button
                                  onClick={() => handleApproval(cuti.id, 'atasan', 'ditolak')}
                                  className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                  title="Tolak"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {cuti.status_diketahui_hrd ? getStatusBadge(cuti.status_diketahui_hrd) : '-'}
                            {canApproveAsHRD(cuti) && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleApproval(cuti.id, 'hrd', 'disetujui')}
                                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                  title="Setujui"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Setuju
                                </button>
                                <button
                                  onClick={() => handleApproval(cuti.id, 'hrd', 'ditolak')}
                                  className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                  title="Tolak"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {cuti.status_disetujui ? getStatusBadge(cuti.status_disetujui) : '-'}
                            {canApproveAsPimpinan(cuti) && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleApproval(cuti.id, 'pimpinan', 'disetujui')}
                                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                  title="Setujui"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Setuju
                                </button>
                                <button
                                  onClick={() => handleApproval(cuti.id, 'pimpinan', 'ditolak')}
                                  className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                  title="Tolak"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
    {/* Tombol Detail */}
    <button
      onClick={() => openDetailModal(cuti)}
      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      title="Lihat Detail"
    >
      <Eye className="w-4 h-4" />
    </button>

    {/* Tombol Approve Atasan */}
    {canApproveAsAtasan(cuti) && (
      <>
        <button
          onClick={() => handleApproval(cuti.id, 'atasan', 'disetujui')}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          title="Setujui sebagai Atasan"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Setuju
        </button>
        <button
          onClick={() => handleApproval(cuti.id, 'atasan', 'ditolak')}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          title="Tolak sebagai Atasan"
        >
          <XCircle className="w-3.5 h-3.5" />
          Tolak
        </button>
      </>
    )}

    {/* Tombol Approve HRD */}
    {canApproveAsHRD(cuti) && (
      <>
        <button
          onClick={() => handleApproval(cuti.id, 'hrd', 'disetujui')}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          title="Setujui sebagai HRD"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Setuju
        </button>
        <button
          onClick={() => handleApproval(cuti.id, 'hrd', 'ditolak')}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          title="Tolak sebagai HRD"
        >
          <XCircle className="w-3.5 h-3.5" />
          Tolak
        </button>
      </>
    )}

    {/* Tombol Approve Pimpinan */}
    {canApproveAsPimpinan(cuti) && (
      <>
        <button
          onClick={() => handleApproval(cuti.id, 'pimpinan', 'disetujui')}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          title="Setujui sebagai Pimpinan"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Setuju
        </button>
        <button
          onClick={() => handleApproval(cuti.id, 'pimpinan', 'ditolak')}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          title="Tolak sebagai Pimpinan"
        >
          <XCircle className="w-3.5 h-3.5" />
          Tolak
        </button>
      </>
    )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        Belum ada pengajuan cuti
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Form Jatah Cuti */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {modalType === 'create' ? 'Tambah Jatah Cuti' : 'Edit Jatah Cuti'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Karyawan</label>
                  <select
                    value={formData.uid}
                    onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={modalType === 'edit'}
                  >
                    <option value="">Pilih Karyawan</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - TMK: {user.tmk}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                  <input
                    type="number"
                    value={formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="2020"
                  />
                </div>

                {modalType === 'create' && (
                  <button
                    type="button"
                    onClick={calculateCuti}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Calculator className="w-4 h-4" />
                    Hitung Otomatis
                  </button>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ke</label>
                  <input
                    type="number"
                    value={formData.tahun_ke}
                    onChange={(e) => setFormData({ ...formData, tahun_ke: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Cuti (hari)</label>
                  <input
                    type="number"
                    value={formData.jumlah_cuti}
                    onChange={(e) => setFormData({ ...formData, jumlah_cuti: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="0"
                  />
                </div>

                {modalType === 'edit' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cuti Dipakai (hari)</label>
                      <input
                        type="number"
                        value={formData.cuti_dipakai}
                        onChange={(e) => setFormData({ ...formData, cuti_dipakai: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sisa Cuti (hari)</label>
                      <input
                        type="number"
                        value={formData.sisa_cuti}
                        onChange={(e) => setFormData({ ...formData, sisa_cuti: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        min="0"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                  <textarea
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {modalType === 'create' ? 'Tambah' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail Pengajuan Cuti */}
       {/* Modal Detail Pengajuan Cuti */}
{showDetailModal && selectedCuti && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800">Detail Pengajuan Cuti</h3>
        <button
          onClick={() => setShowDetailModal(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* ✅ TAMBAHKAN STATUS FINAL DI ATAS */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">STATUS PENGAJUAN:</span>
            {getStatusFinalBadge(selectedCuti.status_final)}
          </div>
          {selectedCuti.status_final === 'ditolak' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                ⚠️ Pengajuan ini telah ditolak. Status tidak dapat diubah lagi.
              </p>
            </div>
          )}
          {selectedCuti.status_final === 'disetujui' && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                ✓ Pengajuan ini telah disetujui oleh semua pihak. Jatah cuti telah dikurangi.
              </p>
            </div>
          )}
        </div>

        {/* Info Karyawan */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">Informasi Karyawan</h4>
          </div>
          <p className="text-lg font-medium text-gray-900">{selectedCuti.user?.name}</p>
          <p className="text-sm text-gray-600">{selectedCuti.user?.email}</p>
        </div>

        {/* Periode & Durasi */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Tanggal Mulai</label>
            <p className="text-gray-900">{formatDate(selectedCuti.tanggal_mulai)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Tanggal Selesai</label>
            <p className="text-gray-900">{formatDate(selectedCuti.tanggal_selesai)}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Durasi Cuti:</span>
            <span className="text-lg font-bold text-blue-600">{selectedCuti.jumlah_hari} hari</span>
          </div>
        </div>

        {/* Alasan */}
        <div>
          <label className="text-sm font-medium text-gray-600">Alasan Cuti</label>
          <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded">{selectedCuti.alasan}</p>
        </div>

        {/* Delegasi Tugas */}
        {selectedCuti.id_penerima_tugas && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Delegasi Tugas</h4>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">Penerima Tugas</span>
              </div>
              <p className="text-sm text-gray-900 ml-6">
                {selectedCuti.penerima_tugas?.name || 'N/A'}
              </p>
            </div>
            {selectedCuti.tugas && (
              <div>
                <label className="text-sm font-medium text-gray-600">Deskripsi Tugas</label>
                <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded text-sm">
                  {selectedCuti.tugas}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status Persetujuan */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Status Persetujuan</h4>
          <div className="space-y-3">
            {/* Atasan */}
            {selectedCuti.diketahui_atasan_user && (
              <div className={`rounded-lg p-4 ${
                selectedCuti.status_final === 'ditolak' || selectedCuti.status_final === 'disetujui'
                  ? 'bg-gray-100 opacity-75'
                  : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedCuti.diketahui_atasan_user.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedCuti.diketahui_atasan_user.jabatan || 'Atasan'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(selectedCuti.status_diketahui_atasan)}
                </div>
                {canApproveAsAtasan(selectedCuti) && selectedCuti.status_final === 'diproses' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleApproval(selectedCuti.id, 'atasan', 'disetujui')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Setujui
                    </button>
                    <button
                      onClick={() => handleApproval(selectedCuti.id, 'atasan', 'ditolak')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* HRD */}
            {selectedCuti.diketahui_hrd_user && (
              <div className={`rounded-lg p-4 ${
                selectedCuti.status_final === 'ditolak' || selectedCuti.status_final === 'disetujui'
                  ? 'bg-gray-100 opacity-75'
                  : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedCuti.diketahui_hrd_user.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedCuti.diketahui_hrd_user.jabatan || 'HRD'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(selectedCuti.status_diketahui_hrd)}
                </div>
                {canApproveAsHRD(selectedCuti) && selectedCuti.status_final === 'diproses' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleApproval(selectedCuti.id, 'hrd', 'disetujui')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Setujui
                    </button>
                    <button
                      onClick={() => handleApproval(selectedCuti.id, 'hrd', 'ditolak')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pimpinan */}
            {selectedCuti.disetujui_user && (
              <div className={`rounded-lg p-4 ${
                selectedCuti.status_final === 'ditolak' || selectedCuti.status_final === 'disetujui'
                  ? 'bg-gray-100 opacity-75'
                  : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedCuti.disetujui_user.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedCuti.disetujui_user.jabatan || 'Pimpinan'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(selectedCuti.status_disetujui)}
                </div>
                {canApproveAsPimpinan(selectedCuti) && selectedCuti.status_final === 'diproses' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleApproval(selectedCuti.id, 'pimpinan', 'disetujui')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Setujui
                    </button>
                    <button
                      onClick={() => handleApproval(selectedCuti.id, 'pimpinan', 'ditolak')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Catatan */}
        {selectedCuti.catatan && (
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-gray-600">Catatan</label>
            <p className="text-gray-900 mt-1 bg-yellow-50 p-3 rounded border border-yellow-200">
              {selectedCuti.catatan}
            </p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-200">
        <button
          onClick={() => setShowDetailModal(false)}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </LayoutTemplate>
  );
}

export default Cuti;