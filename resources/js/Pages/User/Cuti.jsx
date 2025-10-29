import React, { useState, useEffect } from 'react';
import { Calendar, Eye, Plus, Clock, AlertCircle, FileText,Download, User, X, Save, CheckCircle } from 'lucide-react';
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
    diketahui_atasan: '',
  diketahui_hrd: '',
  disetujui: ''


    
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
          diketahui_atasan: '',
    diketahui_hrd: '',
    disetujui: ''

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
    diketahui_atasan: '',
    diketahui_hrd: '',
    disetujui: ''
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
      if (!formData.diketahui_atasan && !formData.diketahui_hrd && !formData.disetujui) {
    setErrors({
      error: 'Minimal pilih satu jalur persetujuan (Atasan, HRD, atau Pimpinan)'
    });
    return;
  }

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

  const getApprovalStatus = (approverUser, approvalStatus) => {
    if (!approverUser || approverUser === null) {
      return 'diproses';
    }
    if (!approvalStatus || approvalStatus === null) {
      return 'diproses';
    }

    return approvalStatus;
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

<div className="mb-8">
  {jatahCuti.length > 0 && jatahCuti[0] && (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-blue-600 text-white">
        <h2 className="text-xl font-semibold">Informasi Jatah Cuti</h2>
      </div>
      <div className="p-6">
        <table className="w-full">
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="py-2 text-sm text-gray-700 w-1/3">Tahun ke</td>
              <td className="py-2 text-sm text-gray-900 font-medium">: {jatahCuti[0].tahun_ke || '1'}</td>
            </tr>
           <tr>
            <td className="py-2 text-sm text-gray-700">TMK</td>
            <td className="py-2 text-sm text-gray-900 font-medium">
              : {jatahCuti[0].tmk ? new Date(jatahCuti[0].tmk).toLocaleDateString('id-ID', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                }) : '-'}
              {jatahCuti[0].tmk && (
                <span className="text-gray-600 ml-2">
                  ({(() => {
                    const years = jatahCuti[0].masa_kerja_tahun || 0;
                    const months = jatahCuti[0].masa_kerja_bulan || 0;
                    const days = Math.round(jatahCuti[0].masa_kerja_hari || 0); // ✅ dibulatkan
                  
                    let result = [];
                  
                    if (years > 0) result.push(`${years} tahun`);
                    if (months > 0) result.push(`${months} bulan`);
                    if (days > 0 || result.length === 0) result.push(`${days} hari`);
                  
                    return result.join(' ');
                  })()})
                </span>
              )}
            </td>
          </tr>

            <tr>
              <td className="py-2 text-sm text-gray-700">Hak cuti sebenarnya</td>
              <td className="py-2 text-sm text-gray-900 font-medium">
                : {jatahCuti[0].jumlah_cuti} hari
                {/* <button className="ml-3 text-blue-600 hover:text-blue-800 text-xs underline">
                  Klik untuk setting hak cuti
                </button> */}
              </td>
            </tr>
            <tr>
              <td className="py-2 text-sm text-gray-700">Dipinjam utk tahun ke {Math.max(jatahCuti[0].tahun_ke - 1, 0)}</td>
              <td className="py-2 text-sm text-gray-900 font-medium">: {jatahCuti[0].pinjam_tahun_0 || '0'} hari</td>
            </tr>
            <tr>
              <td className="py-2 text-sm text-gray-700">Dapat dipinjam cuti tahun ke {jatahCuti[0].tahun_ke +1}</td>
              <td className="py-2 text-sm text-gray-900 font-medium">
                : {jatahCuti[1].sisa_cuti || '0'} hari
                {/* <button className="ml-3 text-blue-600 hover:text-blue-800 text-xs underline">
                  Klik untuk pinjam cuti tahun ke 2
                </button> */}
              </td>
            </tr>
            <tr>
              <td className="py-2 text-sm text-gray-700">Cuti bersama</td>
              <td className="py-2 text-sm text-gray-900 font-medium">: {jatahCuti[0].cuti_bersama || '0'} hari</td>
            </tr>
            <tr>
              <td className="py-2 text-sm text-gray-700">Telah terpakai</td>
              <td className="py-2 text-sm text-gray-900 font-medium">: {jatahCuti[0].cuti_dipakai || '0'} hari</td>
            </tr>
            <tr className="bg-blue-50">
              <td className="py-2 text-sm font-semibold text-gray-900">Sisa cuti</td>
              <td className="py-2 text-sm font-bold text-blue-600">: {jatahCuti[0].sisa_cuti} hari</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )}
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
                        {getStatusBadge(cuti.status_final)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
  <div className="flex items-center justify-center gap-2">
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
    <button
      onClick={() => {
        window.open(`/cuti/download-pdf/${cuti.id}`, '_blank');
      }}
      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
      title="Download PDF"
    >
      <Download className="w-4 h-4" />
    </button>
  </div>
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
                    Alur Persetujuan <span className="text-red-500 text-xs">(Minimal pilih 1)</span>
                  </h4>
                  <div className="space-y-3">
                    {/* Diketahui Atasan */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diketahui Atasan (Supervisor/Manager)
                      </label>
                      <select
                        name="diketahui_atasan"
                        value={formData.diketahui_atasan}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Pilih Atasan</option>
                        {approvers.map((approver) => (
                          <option key={approver.id} value={approver.id}>
                            {approver.name} {approver.jabatan ? `- ${approver.jabatan}` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.diketahui_atasan && (
                        <p className="text-red-500 text-sm mt-1">{errors.diketahui_atasan}</p>
                      )}
                    </div>
                    
                    {/* Diketahui HRD */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diketahui HRD
                      </label>
                      <select
                        name="diketahui_hrd"
                        value={formData.diketahui_hrd}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Pilih HRD</option>
                        {approvers.map((approver) => (
                          <option key={approver.id} value={approver.id}>
                            {approver.name} {approver.jabatan ? `- ${approver.jabatan}` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.diketahui_hrd && (
                        <p className="text-red-500 text-sm mt-1">{errors.diketahui_hrd}</p>
                      )}
                    </div>
                    
                    {/* Disetujui */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Disetujui (Direktur/Pimpinan)
                      </label>
                      <select
                        name="disetujui"
                        value={formData.disetujui}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Pilih Pimpinan</option>
                        {approvers.map((approver) => (
                          <option key={approver.id} value={approver.id}>
                            {approver.name} {approver.jabatan ? `- ${approver.jabatan}` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.disetujui && (
                        <p className="text-red-500 text-sm mt-1">{errors.disetujui}</p>
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

{jatahCuti[0].is_periode_0 && (
  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-yellow-900">
          Masa Percobaan - Belum Mendapat Jatah Cuti
        </p>
        <p className="text-sm text-yellow-700 mt-1">
          Anda masih dalam periode percobaan. Jatah cuti 12 hari akan aktif setelah Anda bekerja selama 1 tahun penuh.
        </p>
      </div>
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
                      <div className="mt-1">{getStatusBadge(selectedCuti.status_final)}</div>
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

                {/* Status Approval */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Status Persetujuan</h4>
                  <div className="space-y-3">
                    {/* Atasan - Selalu tampil */}
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Diketahui Atasan</p>
                        <p className="text-xs text-gray-600">
                          {selectedCuti.diketahui_atasan_user?.name || 'Belum Ditentukan'}
                        </p>
                      </div>
                      {getStatusBadge(getApprovalStatus(
                        selectedCuti.diketahui_atasan_user, 
                        selectedCuti.status_diketahui_atasan
                      ))}
                    </div>
                    
                    {/* HRD - Selalu tampil */}
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Diketahui HRD</p>
                        <p className="text-xs text-gray-600">
                          {selectedCuti.diketahui_hrd_user?.name || 'Belum Ditentukan'}
                        </p>
                      </div>
                      {getStatusBadge(getApprovalStatus(
                        selectedCuti.diketahui_hrd_user, 
                        selectedCuti.status_diketahui_hrd
                      ))}
                    </div>
                    
                    {/* Pimpinan - Selalu tampil */}
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Disetujui Pimpinan</p>
                        <p className="text-xs text-gray-600">
                          {selectedCuti.disetujui_user?.name || 'Belum Ditentukan'}
                        </p>
                      </div>
                      {getStatusBadge(getApprovalStatus(
                        selectedCuti.disetujui_user, 
                        selectedCuti.status_disetujui
                      ))}
                    </div>
                  </div>
                </div>
                {selectedCuti.catatan && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-600">Catatan dari Atasan</label>
                    <p className="text-gray-900 mt-1 bg-yellow-50 p-3 rounded border border-yellow-200">
                      {selectedCuti.catatan}
                    </p>
                  </div>
                )}

              {(selectedCuti.status_diketahui_atasan === 'diproses' || 
  selectedCuti.status_diketahui_hrd === 'diproses' || 
  selectedCuti.status_disetujui === 'diproses') && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
    <div>
      <p className="text-sm font-medium text-yellow-900">Menunggu Persetujuan</p>
      <p className="text-sm text-yellow-700">
        Pengajuan cuti Anda sedang dalam proses review. 
        Silakan cek status approval di atas untuk melihat progress.
      </p>
    </div>
  </div>
)}

                {selectedCuti.status_final === 'diproses' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Menunggu Persetujuan</p>
                      <p className="text-sm text-yellow-700">Pengajuan cuti Anda sedang dalam proses review oleh HRD</p>
                    </div>
                  </div>
                )}
              </div>
                            <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
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

export default UserCuti;