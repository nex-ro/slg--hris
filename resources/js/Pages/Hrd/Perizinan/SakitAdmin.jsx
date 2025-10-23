import { useState ,useEffect} from "react";
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { Head, router, usePage } from '@inertiajs/react';
import { Calendar, FileText,Plus, CheckCircle, XCircle, Clock, User, Mail, Check, X as XIcon, Edit2, Trash2, Upload, Eye } from "lucide-react";

function SakitAdmin() {
  const { sakits, flash } = usePage().props;
  const [users, setUsers] = useState([]);
const [loadingUsers, setLoadingUsers] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
  uid: "", // TAMBAHAN INI
  tanggal_mulai: "",
  tanggal_selesai: "",
  bukti: null,
  keterangan: "",
  currentBukti: null,
  status: "Diproses"
});

  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };
  useEffect(() => {
  if (showModal && !editMode) {
    fetchUsers();
  }
}, [showModal, editMode]);

useEffect(() => {
  const interval = setInterval(() => {
    router.reload({ only: ['sakits'] });
  }, 5000);
  return () => clearInterval(interval);
}, []);


useEffect(() => {
  const handleSuccess = () => {
    router.reload({ only: ['sakits'] });
  };

  window.addEventListener('sakit-updated', handleSuccess);
  
  return () => {
    window.removeEventListener('sakit-updated', handleSuccess);
  };
}, []);


const fetchUsers = async () => {
  setLoadingUsers(true);
  try {
    const response = await fetch('/api/users');
    const data = await response.json();
    setUsers(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    alert('Gagal memuat data karyawan');
  } finally {
    setLoadingUsers(false);
  }
};


  const handleOpenModal = (data = null) => {
  if (data) {
    // Mode Edit
    setEditMode(true);
    setSelectedId(data.id);
    setFormData({
      uid: data.uid, // TAMBAHAN INI
      tanggal_mulai: data.tanggal_mulai,
      tanggal_selesai: data.tanggal_selesai,
      bukti: null,
      keterangan: data.keterangan,
      currentBukti: data.bukti_url,
      status: data.status || "Diproses"
    });
    setFileName("");
  } else {
    // Mode Create - TAMBAHAN INI
    setEditMode(false);
    setSelectedId(null);
    setFormData({
      uid: "",
      tanggal_mulai: "",
      tanggal_selesai: "",
      bukti: null,
      keterangan: "",
      currentBukti: null,
      status: "Diproses"
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
    uid: "", // TAMBAHAN INI
    tanggal_mulai: "",
    tanggal_selesai: "",
    bukti: null,
    keterangan: "",
    currentBukti: null,
    status: "Diproses"
  });
  setFileName("");
  setUsers([]); // TAMBAHAN INI - reset users saat tutup modal
};

  const handleSubmit = (e) => {
  e.preventDefault();
  
  // Validasi untuk mode create
  if (!editMode && !formData.uid) {
    alert("Pilih karyawan terlebih dahulu!");
    return;
  }
  
  if (!formData.tanggal_mulai || !formData.tanggal_selesai) {
    alert("Tanggal mulai dan selesai harus diisi!");
    return;
  }
  
  if (!formData.keterangan) {
    alert("Keterangan harus diisi!");
    return;
  }

  setProcessing(true);

  const data = new FormData();
  data.append('tanggal_mulai', formData.tanggal_mulai);
  data.append('tanggal_selesai', formData.tanggal_selesai);
  data.append('keterangan', formData.keterangan);
  data.append('status', formData.status);
  
  if (formData.bukti) {
    data.append('bukti', formData.bukti);
  }

  if (editMode) {
    // Mode Edit
    data.append('_method', 'PUT');
    router.post(`/admin/sakit/${selectedId}`, data, {
      onSuccess: () => {
        handleCloseModal();
        setProcessing(false);
          router.reload({ only: ['sakits'], preserveScroll: true });

      },
      onError: (errors) => {
        console.error(errors);
        alert('Terjadi kesalahan saat mengupdate data');
        setProcessing(false);
      }
    });
  } else {
    // Mode Create - TAMBAHAN INI
    data.append('uid', formData.uid);
    router.post('/admin/sakit', data, {
      onSuccess: () => {
        handleCloseModal();
        setProcessing(false);
          router.reload({ only: ['sakits'], preserveScroll: true });

      },
      onError: (errors) => {
        console.error(errors);
        alert('Terjadi kesalahan saat menyimpan data');
        setProcessing(false);
      }
    });
  }
};

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2048000) {
        alert("Ukuran file maksimal 2MB!");
        e.target.value = "";
        return;
      }
      
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

  const handleUpdateStatus = (id, newStatus) => {
    const statusText = newStatus === 'Disetujui' ? 'menyetujui' : 'menolak';
    if (window.confirm(`Apakah Anda yakin ingin ${statusText} izin sakit ini?`)) {
      setProcessing(true);
      
      router.put(`/admin/sakit/${id}/status`, 
        { status: newStatus },
        {
          onSuccess: () => {
            setProcessing(false);
              router.reload({ only: ['sakits'], preserveScroll: true });

          },
          onError: (errors) => {
            console.error(errors);
            alert('Terjadi kesalahan saat mengupdate status');
            setProcessing(false);
          }
        }
      );
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      router.delete(`/admin/sakit/${id}`, {
        onSuccess: () => {
          alert("Data berhasil dihapus!");
            router.reload({ only: ['sakits'], preserveScroll: true });

        },
        onError: (errors) => {
          console.error(errors);
          alert('Terjadi kesalahan saat menghapus data');
        }
      });
    }
  };

  const handleViewBukti = (buktiPath) => {
    // Buka file dari storage Laravel
    window.open(`/storage/${buktiPath}`, '_blank');
  };



  const handleTanggalMulaiChange = (e) => {
    const value = e.target.value;
    setFormData({ 
      ...formData, 
      tanggal_mulai: value,
      tanggal_selesai: value
    });
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
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-5 h-5" />
          Ajukan Izin Sakit
        </button>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Menunggu Verifikasi</p>
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
                      Karyawan
                    </th>
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
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        Belum ada data izin sakit
                      </td>
                    </tr>
                  ) : (
                    sakits.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-start gap-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.user_name}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm">
                            <div>
                              <div className="text-gray-900 font-medium">
                                {formatDate(item.tanggal_mulai)}
                              </div>
                              {item.tanggal_mulai !== item.tanggal_selesai && (
                                <div className="text-gray-500 text-xs">
                                  s/d {formatDate(item.tanggal_selesai)}
                                </div>
                              )}
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
                          <td className="px-6 py-4 whitespace-nowrap">
                          {item.bukti ? (
                            <button
                              onClick={() => handleViewBukti(item.bukti)}
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <Eye className="w-4 h-4" />
                              Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">Tidak ada bukti</span>
                          )}
                        </td>
                        
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.status === 'Diproses' ?(
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(item.id, 'Disetujui')}
                                  disabled={processing}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-medium ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title="Setujui"
                                >
                                  <Check className="w-3 h-3" />
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(item.id, 'Ditolak')}
                                  disabled={processing}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title="Tolak"
                                >
                                  <XIcon className="w-3 h-3" />
                                  Tolak
                                </button>
                              </>
                            ): getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Edit Modal */}
        {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {editMode ? 'Edit Izin Sakit' : 'Tambah Izin Sakit'} {/* UBAH INI */}
        </h2>
        <button
          onClick={handleCloseModal}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          disabled={processing}
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {/* TAMBAHAN INI - Select Karyawan (hanya muncul di mode create) */}
          {!editMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Karyawan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.uid}
                onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
                disabled={processing || loadingUsers}
              >
                <option value="">
                  {loadingUsers ? 'Memuat data karyawan...' : 'Pilih Karyawan'}
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.jabatan || 'No Position'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bagian form lainnya tetap sama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tanggal_mulai}
                onChange={handleTanggalMulaiChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
                disabled={processing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tanggal_selesai}
                onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                min={formData.tanggal_mulai}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
                disabled={processing}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={processing}
            >
              <option value="Diproses">Diproses</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Status default: Diproses
            </p>
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
              placeholder="Jelaskan kondisi/keluhan..."
              required
              disabled={processing}
            />
          </div>

          {/* Preview Current Image */}
          {formData.currentBukti && isImageFile(formData.currentBukti) && !fileName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bukti Saat Ini
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                <img 
                  src={formData.currentBukti} 
                  alt="Bukti saat ini" 
                  className="max-w-full h-auto max-h-64 mx-auto rounded"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bukti Surat Dokter (Opsional)
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="bukti-upload"
                disabled={processing}
              />
              <label
                htmlFor="bukti-upload"
                className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">
                    {fileName || (editMode ? "Klik untuk upload file baru (opsional)" : "Klik untuk upload file")}
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
            {processing ? '⏳ Memproses...' : (editMode ? '💾 Update Data' : '💾 Simpan Data')} {/* UBAH INI */}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

        {/* Image Preview Modal */}
       
      </div>
    </LayoutTemplate>
  );
}

export default SakitAdmin;