import { useState } from "react";
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Calendar, FileText, CheckCircle, XCircle, Clock, Upload, X } from "lucide-react";

function Sakit() {
  const { sakits, flash } = usePage().props; // Ambil data dari backend
  const [dateError, setDateError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    tanggal_mulai: "",
    tanggal_selesai: "",
    bukti: null,
    keterangan: ""
  });
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);

   const handleView = (bukti) => {
    // Akses langsung via storage URL
    console.log(bukti)
    const url = `/storage/${bukti}`;
    window.open(url, '_blank');
  };

// Perbaiki fungsi validasi tanggal
const isWeekend = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString + 'T00:00:00'); // Tambahkan waktu untuk menghindari timezone issue
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

const getMinDate = () => {
  const today = new Date();
  let count = 0;
  let currentDate = new Date(today);
  
  // Mundur 3 hari kerja (tidak termasuk Sabtu & Minggu)
  while (count < 3) {
    currentDate.setDate(currentDate.getDate() - 1);
    const dayOfWeek = currentDate.getDay();
    
    // Jika bukan Sabtu (6) atau Minggu (0), hitung sebagai hari kerja
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  
  return currentDate.toISOString().split('T')[0];
};


// Fungsi untuk mendapatkan hari kerja berikutnya
const getNextWorkingDay = (dateString) => {
  let date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + 1);
  
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  
  return date.toISOString().split('T')[0];
};

// Fungsi untuk validasi range tanggal
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  
  return end >= start;
};

  const handleOpenModal = (data = null) => {
    if (data) {
      setEditMode(true);
      setSelectedId(data.id);
      setFormData({
        tanggal_mulai: data.tanggal_mulai,
        tanggal_selesai: data.tanggal_selesai,
        bukti: null,
        keterangan: data.keterangan
      });
      setFileName("");
    } else {
      setEditMode(false);
      setSelectedId(null);
      setFormData({
        tanggal_mulai: "",
        tanggal_selesai: "",
        bukti: null,
        keterangan: ""
      });
      setFileName("");
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedId(null);
    setFormData({
      tanggal_mulai: "",
      tanggal_selesai: "",
      bukti: null,
      keterangan: ""
    });
    setFileName("");
  };

  const handleSubmit = (e) => {
  e.preventDefault();
  
  // Validasi
  if (!formData.tanggal_mulai || !formData.tanggal_selesai) {
    alert("Tanggal mulai dan selesai harus diisi!");
    return;
  }
  // Validasi weekend
  if (isWeekend(formData.tanggal_mulai)) {
    alert("Tanggal mulai tidak boleh di hari Sabtu atau Minggu!");
    return;
  }
  
  if (isWeekend(formData.tanggal_selesai)) {
    alert("Tanggal selesai tidak boleh di hari Sabtu atau Minggu!");
    return;
  }
  
  // Validasi H-3
  const minDate = new Date(getMinDate());
  const selectedDate = new Date(formData.tanggal_mulai);
  
  if (selectedDate < minDate) {
    alert("Tanggal mulai tidak boleh lebih dari H-3 hari kerja!");
    return;
  }
  
  if (!formData.keterangan) {
    alert("Keterangan harus diisi!");
    return;
  }
  
  if (!editMode && !formData.bukti) {
    alert("Bukti surat dokter harus diupload!");
    return;
  }

    setProcessing(true);

    // Buat FormData untuk upload file
    const data = new FormData();
    data.append('tanggal_mulai', formData.tanggal_mulai);
    data.append('tanggal_selesai', formData.tanggal_selesai);
    data.append('keterangan', formData.keterangan);
    if (formData.bukti) {
      data.append('bukti', formData.bukti);
    }

    if (editMode) {
      // Update data
      data.append('_method', 'PUT');
      router.post(`/sakit/${selectedId}`, data, {
        onSuccess: () => {
          handleCloseModal();
          setProcessing(false);
        },
        onError: (errors) => {
          console.error(errors);
          alert('Terjadi kesalahan saat mengupdate data');
          setProcessing(false);
        }
      });
    } else {
      // Create data baru
      router.post('/sakit', data, {
        onSuccess: () => {
          handleCloseModal();
          setProcessing(false);
        },
        onError: (errors) => {
          console.error(errors);
          alert('Terjadi kesalahan saat mengirim data');
          setProcessing(false);
        }
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi ukuran file (max 2MB)
      if (file.size > 2048000) {
        alert("Ukuran file maksimal 2MB!");
        e.target.value = "";
        return;
      }
      
      // Validasi format file
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert("Format file harus PDF, JPG, JPEG, atau PNG!");
        e.target.value = "";
        return;
      }
      
      setFormData({ ...formData, bukti: file });
      setFileName(file.name);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      router.delete(`/sakit/${id}`, {
        onSuccess: () => {
          alert("Data berhasil dihapus!");
        },
        onError: (errors) => {
          console.error(errors);
          alert('Terjadi kesalahan saat menghapus data');
        }
      });
    }
  };

  const handleDownload = (id, bukti) => {
  window.open(`/sakit/${id}/download`, '_blank');
};

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Diproses': { color: "bg-yellow-100 text-yellow-800", icon: Clock, text: "Diproses" },
      'Disetujui': { color: "bg-green-100 text-green-800", icon: CheckCircle, text: "Disetujui" },
      'Ditolak': { color: "bg-red-100 text-red-800", icon: XCircle, text: "Ditolak" }
    };
    const config = statusConfig[status] || statusConfig['Diproses'];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} hari`;
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const canEdit = (status) => {
    return status === 'Diproses';
  };

  // Hitung statistik
  const stats = {
    diproses: sakits.filter(s => s.status === 'Diproses').length,
    disetujui: sakits.filter(s => s.status === 'Disetujui').length,
    ditolak: sakits.filter(s => s.status === 'Ditolak').length
  };

  return (
    <LayoutTemplate>
      <Head title="Sakit" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Flash Message */}
          {flash?.success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {flash.success}
            </div>
          )}
          {flash?.error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {flash.error}
            </div>
          )}

          {/* Header */}
         <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Izin Sakit</h1>
            <p className="text-gray-600 mt-1">Kelola pengajuan izin sakit Anda</p>
          </div>

          {/* Tombol aksi */}
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-5 h-5" />
            Ajukan Izin Sakit
          </button>
        </div>


          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Diproses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.diproses}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disetujui</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.disetujui}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ditolak</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.ditolak}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Durasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Keterangan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Bukti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sakits.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        Belum ada data izin sakit
                      </td>
                    </tr>
                  ) : (
                    sakits.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-gray-900 font-medium">
                                {formatDate(item.tanggal_mulai)}
                              </div>
                              <div className="text-gray-500 text-xs">
                                s/d {formatDate(item.tanggal_selesai)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                            {calculateDuration(item.tanggal_mulai, item.tanggal_selesai)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <div className="line-clamp-2">{item.keterangan || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                         {item.bukti ? (
                            <button
                              onClick={() => handleView(item.bukti)}
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <FileText className="w-4 h-4" />
                              Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {canEdit(item.status) ? (
                              <>
                                <button
                                  onClick={() => handleOpenModal(item)}
                                  className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Tidak dapat diubah
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editMode ? "Edit Izin Sakit" : "Ajukan Izin Sakit"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={processing}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Tanggal Mulai <span className="text-red-500">*</span>
    </label>
    <input
      type="date"
      value={formData.tanggal_mulai}
      onChange={(e) => {
        const selectedDate = e.target.value;
        
        // Validasi weekend
        if (isWeekend(selectedDate)) {
          setDateError("Tidak bisa memilih hari Sabtu atau Minggu!");
          // Reset input
          setFormData({ ...formData, tanggal_mulai: "" });
          return;
        }
        
        // Validasi H-3
        const minDate = new Date(getMinDate());
        const selected = new Date(selectedDate + 'T00:00:00');
        
        if (selected < minDate) {
          setDateError("Tanggal tidak boleh lebih dari H-3 hari kerja!");
          setFormData({ ...formData, tanggal_mulai: "" });
          return;
        }
        
        // Validasi tanggal selesai jika sudah diisi
        if (formData.tanggal_selesai && !validateDateRange(selectedDate, formData.tanggal_selesai)) {
          setFormData({ 
            ...formData, 
            tanggal_mulai: selectedDate,
            tanggal_selesai: "" // Reset tanggal selesai
          });
          setDateError("Tanggal selesai akan direset karena tidak valid");
          setTimeout(() => setDateError(""), 3000);
        } else {
          setFormData({ ...formData, tanggal_mulai: selectedDate });
          setDateError("");
        }
      }}
      min={getMinDate()}
      className={`w-full px-4 py-2 border ${dateError ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
      required
      disabled={processing}
    />
    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
      <Calendar className="w-3 h-3" />
      Maksimal H-3 hari kerja (tidak termasuk weekend)
    </p>
    {dateError && (
      <p className="text-xs text-red-600 mt-1 font-medium animate-pulse">
        ⚠️ {dateError}
      </p>
    )}
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Tanggal Selesai <span className="text-red-500">*</span>
    </label>
    <input
      type="date"
      value={formData.tanggal_selesai}
      onChange={(e) => {
        const selectedDate = e.target.value;
        
        // Validasi weekend
        if (isWeekend(selectedDate)) {
          setDateError("Tidak bisa memilih hari Sabtu atau Minggu!");
          setFormData({ ...formData, tanggal_selesai: "" });
          return;
        }
        
        // Validasi tanggal mulai harus diisi dulu
        if (!formData.tanggal_mulai) {
          setDateError("Pilih tanggal mulai terlebih dahulu!");
          return;
        }
        
        // Validasi range
        if (!validateDateRange(formData.tanggal_mulai, selectedDate)) {
          setDateError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai!");
          setFormData({ ...formData, tanggal_selesai: "" });
          return;
        }
        
        setFormData({ ...formData, tanggal_selesai: selectedDate });
        setDateError("");
      }}
      min={formData.tanggal_mulai || getMinDate()}
      className={`w-full px-4 py-2 border ${dateError ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${!formData.tanggal_mulai ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      required
      disabled={processing || !formData.tanggal_mulai}
    />
    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
      <Calendar className="w-3 h-3" />
      {formData.tanggal_mulai 
        ? "Pilih tanggal selesai (tidak termasuk weekend)"
        : "Pilih tanggal mulai terlebih dahulu"
      }
    </p>
  </div>
</div>

{/* Info Box - Tambahkan di bawah grid tanggal */}
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <div className="bg-blue-500 rounded-full p-1 mt-0.5">
      <Calendar className="w-4 h-4 text-white" />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-blue-900 mb-1">
        Ketentuan Pengajuan Izin Sakit:
      </h4>
      <ul className="text-xs text-blue-800 space-y-1">
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">•</span>
          <span>Pengajuan maksimal H-3 hari kerja dari tanggal izin</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">•</span>
          <span>Tidak dapat memilih hari Sabtu dan Minggu</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">•</span>
          <span>Wajib melampirkan surat keterangan dokter</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">•</span>
          <span>Data hanya dapat diubah jika status masih "Diproses"</span>
        </li>
      </ul>
    </div>
  </div>
</div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keterangan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      placeholder="Jelaskan kondisi/keluhan Anda..."
                      required
                      disabled={processing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bukti Surat Dokter {!editMode && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        id="bukti-upload"
                        required={!editMode}
                        disabled={processing}
                      />
                      <label
                        htmlFor="bukti-upload"
                        className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-600">
                            {fileName || "Klik untuk upload file"}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Format: PDF, JPG, PNG (Max 2MB)
                          </p>
                        </div>
                      </label>
                    </div>
                    {editMode && (
                      <p className="text-xs text-gray-500 mt-2">
                        * Kosongkan jika tidak ingin mengubah file
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t">
                  
                  <button
                    onClick={handleCloseModal}
                    disabled={processing}
                    className={`flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={processing}
                    className={`flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {processing ? '⏳ Memproses...' : (editMode ? "💾 Update Data" : "Ajukan Izin")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutTemplate>
  );
}

export default Sakit;