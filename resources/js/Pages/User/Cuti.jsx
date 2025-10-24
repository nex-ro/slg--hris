import React, { useState, useEffect } from 'react';
import { Calendar, Eye, Plus, Clock, AlertCircle, FileText, User, X, Save, CheckCircle } from 'lucide-react';
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { router } from '@inertiajs/react';

function UserCuti({ jatahCuti = [], pemakaianCuti = [] }) {
  const [selectedCuti, setSelectedCuti] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [rekanKerja, setRekanKerja] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [approvers, setApprovers] = useState([]);
  const [formData, setFormData] = useState({
    jatah_cuti_id: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    cuti_setengah_hari: false,
    alasan: '',
    id_penerima_tugas: '',
    tugas: '',
        disetujui_oleh: '',
    diketahui_oleh: '',
    diterima: ''

    
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (showFormModal) {
      fetchRekanKerja();
      fetchApprovers();
    }
  }, [showFormModal]);
  

   const fetchRekanKerja = async () => {
    try {
      const response = await fetch('/cuti/rekan-kerja');
      const data = await response.json();
      setRekanKerja(data);
    } catch (error) {
      console.error('Error fetching rekan kerja:', error);
    }
  };
  const fetchApprovers = async () => {
    try {
      const response = await fetch('/cuti/approvers');
      const data = await response.json();
      setApprovers(data);
    } catch (error) {
      console.error('Error fetching approvers:', error);
    }
  };

    const openFormModal = () => {
    setFormData({
      jatah_cuti_id: jatahCuti.length > 0 ? jatahCuti[0].id : '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      cuti_setengah_hari: false,
      alasan: '',
      id_penerima_tugas: '',
      tugas: '',
      disetujui_oleh: '',
      diketahui_oleh: '',
      diterima: ''
    });
    setErrors({});
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setFormData({
      jatah_cuti_id: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      cuti_setengah_hari: false,
      alasan: '',
      id_penerima_tugas: '',
      tugas: '',
      disetujui_oleh: '',
      diketahui_oleh: '',
      diterima: ''
    });
    setErrors({});
  };


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Auto set tanggal_selesai jika setengah hari
    if (name === 'cuti_setengah_hari' && checked) {
      setFormData({
        ...formData,
        cuti_setengah_hari: true,
        tanggal_selesai: formData.tanggal_mulai
      });
    }
    
    // Clear error saat user mengetik
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const calculateWorkDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workDays = 0;
    
    let current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // 0 = Minggu, 6 = Sabtu
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return formData.cuti_setengah_hari ? 0.5 : workDays;
  };

  const workDays = calculateWorkDays(formData.tanggal_mulai, formData.tanggal_selesai);
  const selectedJatah = jatahCuti.find(j => j.id === parseInt(formData.jatah_cuti_id));

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);
    
    router.post('/cuti/store', formData, {
      onSuccess: () => {
        closeFormModal();
        setProcessing(false);
      },
      onError: (errors) => {
        setErrors(errors);
        setProcessing(false);
      }
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
      'disetujui': { bg: 'bg-green-100', text: 'text-green-800', label: 'Disetujui' },
      'ditolak': { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' }
    };
    const config = statusConfig[status] || statusConfig['pending'];
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

  return (
    <LayoutTemplate>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cuti Saya</h1>
          <p className="text-gray-600">Kelola pengajuan cuti Anda</p>
        </div>

        {/* Jatah Cuti Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Jatah Cuti Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  {jatahCuti.map((jatah) => (
    <div 
      key={jatah.id} 
      className={`rounded-lg p-6 text-white shadow-lg ${
        jatah.is_current 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
          : 'bg-gradient-to-br from-purple-500 to-purple-600'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{jatah.label}</h3>
          <p className="text-xs opacity-90 mt-1">{jatah.periode_range}</p>
        </div>
        <Calendar className="w-8 h-8 opacity-80" />
      </div>
      
      {jatah.is_borrowable && (
        <div className="mb-3 bg-white/20 rounded-lg p-2">
          <p className="text-xs font-medium">
            💡 Dapat dipinjam untuk kebutuhan mendadak
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="opacity-90">Total Jatah:</span>
          <span className="font-bold">{jatah.jumlah_cuti} hari</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-90">Terpakai:</span>
          <span className="font-bold">{jatah.cuti_dipakai} hari</span>
        </div>
        <div className="flex justify-between text-lg border-t border-white/20 pt-2">
          <span>Sisa:</span>
          <span className="font-bold">{jatah.sisa_cuti} hari</span>
        </div>
      </div>
    </div>
  ))}
</div>
        </div>

        {/* Riwayat Pengajuan */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Riwayat Pengajuan Cuti</h2>
            <button 
              onClick={openFormModal}
              disabled={jatahCuti.length === 0 || jatahCuti.every(j => j.sisa_cuti <= 0)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Ajukan Cuti Baru
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal Pengajuan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Periode Cuti</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Durasi</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Alasan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pemakaianCuti && pemakaianCuti.length > 0 ? (
                  pemakaianCuti.map((cuti) => (
                    <tr key={cuti.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(cuti.tanggal_pengajuan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {formatDate(cuti.tanggal_mulai)}
                            {cuti.tanggal_mulai !== cuti.tanggal_selesai && 
                              ` - ${formatDate(cuti.tanggal_selesai)}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {cuti.jumlah_hari} hari
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {cuti.alasan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(cuti.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => {
                            setSelectedCuti(cuti);
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Belum ada riwayat pengajuan cuti
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form Pengajuan */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Ajukan Cuti Baru</h3>
                    <p className="text-sm text-gray-600">Isi form untuk mengajukan cuti</p>
                  </div>
                </div>
                <button
                  onClick={closeFormModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Pilih Jatah Cuti */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Pilih Jatah Cuti <span className="text-red-500">*</span>
  </label>
  <select
    name="jatah_cuti_id"
    value={formData.jatah_cuti_id}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    required
  >
    <option value="">Pilih Periode</option>
    {jatahCuti.filter(j => j.sisa_cuti > 0).map((jatah) => (
      <option key={jatah.id} value={jatah.id}>
        {jatah.label} - Sisa: {jatah.sisa_cuti} hari
        {jatah.is_borrowable && ' (Pinjam dari periode depan)'}
      </option>
    ))}
  </select>
  {errors.jatah_cuti_id && (
    <p className="text-red-500 text-sm mt-1">{errors.jatah_cuti_id}</p>
  )}
</div>
                {/* Cuti Setengah Hari */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="cuti_setengah_hari"
                    checked={formData.cuti_setengah_hari}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Cuti Setengah Hari
                  </label>
                </div>

                {/* Tanggal Mulai & Selesai */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Mulai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="tanggal_mulai"
                      value={formData.tanggal_mulai}
                      onChange={(e) => {
                        handleInputChange(e);
                        if (formData.cuti_setengah_hari) {
                          setFormData({
                            ...formData,
                            tanggal_mulai: e.target.value,
                            tanggal_selesai: e.target.value
                          });
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    {errors.tanggal_mulai && (
                      <p className="text-red-500 text-sm mt-1">{errors.tanggal_mulai}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Selesai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="tanggal_selesai"
                      value={formData.tanggal_selesai}
                      onChange={handleInputChange}
                      min={formData.tanggal_mulai || new Date().toISOString().split('T')[0]}
                      disabled={formData.cuti_setengah_hari}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    />
                    {errors.tanggal_selesai && (
                      <p className="text-red-500 text-sm mt-1">{errors.tanggal_selesai}</p>
                    )}
                  </div>
                </div>

                {/* Info Durasi */}
                {workDays > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Durasi Cuti:</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{workDays} hari</span>
                    </div>
                    {selectedJatah && (
                      <div className="mt-2 text-sm text-blue-700">
                        Sisa cuti setelah pengajuan: {(selectedJatah.sisa_cuti - workDays).toFixed(1)} hari
                      </div>
                    )}
                  </div>
                )}

                {/* Warning jika melebihi sisa */}
                {selectedJatah && workDays > selectedJatah.sisa_cuti && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Durasi melebihi sisa cuti!</p>
                      <p className="text-sm text-red-700">Sisa cuti Anda hanya {selectedJatah.sisa_cuti} hari</p>
                    </div>
                  </div>
                )}

                {/* Alasan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alasan Cuti <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="alasan"
                    value={formData.alasan}
                    onChange={handleInputChange}
                    rows="3"
                    maxLength="500"
                    placeholder="Jelaskan alasan pengajuan cuti..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {formData.alasan.length}/500 karakter
                  </div>
                  {errors.alasan && (
                    <p className="text-red-500 text-sm mt-1">{errors.alasan}</p>
                  )}
                </div>
                {/* diketahui oleh */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Alur Persetujuan
                  </h4>

                  <div className="space-y-3">
                    {/* Diperiksa Oleh */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diperiksa Oleh (Supervisor/Manager)
                      </label>
                      <select
                        name="disetujui_oleh"
                        value={formData.disetujui_oleh}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Pilih Pemeriksa</option>
                        {approvers.map((approver) => (
                          <option key={approver.id} value={approver.id}>
                            {approver.name} {approver.jabatan ? `- ${approver.jabatan}` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.disetujui_oleh && (
                        <p className="text-red-500 text-sm mt-1">{errors.disetujui_oleh}</p>
                      )}
                    </div>
                    
                    {/* Diketahui Oleh */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diketahui Oleh (HRD/Manager)
                      </label>
                      <select
                        name="diketahui_oleh"
                        value={formData.diketahui_oleh}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Pilih Yang Mengetahui</option>
                        {approvers.map((approver) => (
                          <option key={approver.id} value={approver.id}>
                            {approver.name} {approver.jabatan ? `- ${approver.jabatan}` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.diketahui_oleh && (
                        <p className="text-red-500 text-sm mt-1">{errors.diketahui_oleh}</p>
                      )}
                    </div>
                    
                    {/* Diterima */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diterima (Direktur/Pimpinan)
                      </label>
                      <select
                        name="diterima"
                        value={formData.diterima}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Pilih Penerima</option>
                        {approvers.map((approver) => (
                          <option key={approver.id} value={approver.id}>
                            {approver.name} {approver.jabatan ? `- ${approver.jabatan}` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.diterima && (
                        <p className="text-red-500 text-sm mt-1">{errors.diterima}</p>
                      )}
                    </div>
                  </div>
                </div>


                {/* Delegasi Tugas */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Delegasi Tugas (Opsional)</h4>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Penerima Tugas
                    </label>
                    <select
                      name="id_penerima_tugas"
                      value={formData.id_penerima_tugas}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih Rekan Kerja</option>
                      {rekanKerja.map((rekan) => (
                        <option key={rekan.id} value={rekan.id}>
                          {rekan.name} {rekan.jabatan ? `- ${rekan.jabatan}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.id_penerima_tugas && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deskripsi Tugas
                      </label>
                      <textarea
                        name="tugas"
                        value={formData.tugas}
                        onChange={handleInputChange}
                        rows="3"
                        maxLength="1000"
                        placeholder="Jelaskan tugas yang akan didelegasikan..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {formData.tugas.length}/1000 karakter
                      </div>
                    </div>
                  )}
                </div>
                
{/* Approval Flow Status - PERBAIKAN */}
{selectedCuti && (selectedCuti.disetujui_oleh_user || selectedCuti.diketahui_oleh_user || selectedCuti.diterima_oleh_user) && (
  <div className="border-t pt-4">
    <h4 className="text-sm font-semibold text-gray-700 mb-3">Status Persetujuan</h4>
    
    {/* Diperiksa Oleh */}
    {selectedCuti.disetujui_oleh_user && (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Diperiksa Oleh</span>
            </div>
            <p className="text-sm text-gray-700 ml-6">
              {selectedCuti.disetujui_oleh_user.name} {selectedCuti.disetujui_oleh_user.jabatan && `- ${selectedCuti.disetujui_oleh_user.jabatan}`}
            </p>
          </div>
          {selectedCuti.status_disetujui_oleh && (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              selectedCuti.status_disetujui_oleh === 'disetujui' 
                ? 'bg-green-100 text-green-800' 
                : selectedCuti.status_disetujui_oleh === 'ditolak'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {selectedCuti.status_disetujui_oleh === 'disetujui' ? 'Disetujui' : 
               selectedCuti.status_disetujui_oleh === 'ditolak' ? 'Ditolak' : 'Menunggu'}
            </span>
          )}
        </div>
      </div>
    )}

    {/* Diketahui Oleh */}
    {selectedCuti.diketahui_oleh_user && (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Diketahui Oleh</span>
            </div>
            <p className="text-sm text-gray-700 ml-6">
              {selectedCuti.diketahui_oleh_user.name} {selectedCuti.diketahui_oleh_user.jabatan && `- ${selectedCuti.diketahui_oleh_user.jabatan}`}
            </p>
          </div>
          {selectedCuti.status_diketahui_oleh && (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              selectedCuti.status_diketahui_oleh === 'disetujui' 
                ? 'bg-green-100 text-green-800' 
                : selectedCuti.status_diketahui_oleh === 'ditolak'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {selectedCuti.status_diketahui_oleh === 'disetujui' ? 'Disetujui' : 
               selectedCuti.status_diketahui_oleh === 'ditolak' ? 'Ditolak' : 'Menunggu'}
            </span>
          )}
        </div>
      </div>
    )}

    {/* Diterima */}
    {selectedCuti.diterima_oleh_user && (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Diterima</span>
            </div>
            <p className="text-sm text-gray-700 ml-6">
              {selectedCuti.diterima_oleh_user.name} {selectedCuti.diterima_oleh_user.jabatan && `- ${selectedCuti.diterima_oleh_user.jabatan}`}
            </p>
          </div>
          {selectedCuti.status_diterima && (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              selectedCuti.status_diterima === 'disetujui' 
                ? 'bg-green-100 text-green-800' 
                : selectedCuti.status_diterima === 'ditolak'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {selectedCuti.status_diterima === 'disetujui' ? 'Disetujui' : 
               selectedCuti.status_diterima === 'ditolak' ? 'Ditolak' : 'Menunggu'}
            </span>
          )}
        </div>
      </div>
    )}
  </div>
)}
                {/* Error Global */}
                {errors.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">{errors.error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={processing || (selectedJatah && workDays > selectedJatah.sisa_cuti)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {processing ? 'Memproses...' : 'Ajukan Cuti'}
                  </button>
                </div>
              </form>
            </div>
            </div>
        )}

        {/* Modal Detail */}
        {showModal && selectedCuti && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Detail Pengajuan Cuti</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedCuti.status)}</div>
                    </div>
                    <div className="text-right">
                      <label className="text-sm font-medium text-gray-600">Durasi</label>
                      <p className="text-2xl font-bold text-blue-600">{selectedCuti.jumlah_hari} hari</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tanggal Pengajuan</label>
                    <p className="text-gray-900">{formatDate(selectedCuti.tanggal_pengajuan)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tahun Jatah</label>
                    <p className="text-gray-900">Tahun {selectedCuti.jatah_cuti?.tahun || '-'}</p>
                  </div>
                </div>

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

                {selectedCuti.cuti_setengah_hari && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Cuti Setengah Hari</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Alasan Cuti</label>
                  <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded">{selectedCuti.alasan}</p>
                </div>

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

                {selectedCuti.catatan && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-600">Catatan dari HRD</label>
                    <p className="text-gray-900 mt-1 bg-yellow-50 p-3 rounded border border-yellow-200">
                      {selectedCuti.catatan}
                    </p>
                  </div>
                )}

                {selectedCuti.disetujui_oleh && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-600">
                      {selectedCuti.status === 'disetujui' ? 'Disetujui Oleh' : 'Ditolak Oleh'}
                    </label>
                    <p className="text-gray-900">{selectedCuti.disetujui_oleh}</p>
                  </div>
                )}

                {selectedCuti.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Menunggu Persetujuan</p>
                      <p className="text-sm text-yellow-700">Pengajuan cuti Anda sedang dalam proses review oleh HRD</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutTemplate>
  );
}

export default UserCuti;