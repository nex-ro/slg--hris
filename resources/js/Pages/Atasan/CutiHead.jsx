import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  Calendar, Eye, Download, Clock, User, CheckCircle, 
  XCircle, X, AlertCircle, ChevronLeft, ChevronRight, Plus, Search, Save ,Trash2 
} from 'lucide-react';
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CutiHead({ auth, jatahCuti = [], pemakaianCuti = [], paginationLinks = [], users = [] }) {
  const cutiList = pemakaianCuti?.data || [];
  const [activeTab, setActiveTab] = useState('pengajuan');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCuti, setSelectedCuti] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [searchPengajuan, setSearchPengajuan] = useState('');
  const [currentPagePengajuan, setCurrentPagePengajuan] = useState(1);
  const itemsPerPagePengajuan = 10;
const cutiListData = Array.isArray(pemakaianCuti) 
  ? pemakaianCuti 
  : (pemakaianCuti?.data || []);

  // State untuk form pengajuan cuti
  const [showFormModal, setShowFormModal] = useState(false);
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
  const [workDays, setWorkDays] = useState(0);

  const currentUserId = auth?.user?.id;

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatHari = (hari) => {
    return Number(hari) % 1 === 0 ? Math.floor(hari) : Number(hari);
  };

  // Tambahkan state ini di bagian useState
const [searchApproval, setSearchApproval] = useState('');
const [currentPageApproval, setCurrentPageApproval] = useState(1);
const itemsPerPageApproval = 10;

// Tambahkan fungsi filter dan pagination untuk approval
const filteredApprovalCuti = cutiListData.filter(cuti => {
  const isAtasan = parseInt(cuti.diketahui_atasan) === parseInt(currentUserId);
  const isHRD = parseInt(cuti.diketahui_hrd) === parseInt(currentUserId);
  const isPimpinan = parseInt(cuti.disetujui) === parseInt(currentUserId);
  
  if (!isAtasan && !isHRD && !isPimpinan) return false;
  
  if (!searchApproval) return true;
  
  const searchLower = searchApproval.toLowerCase();
  return cuti.user?.name?.toLowerCase().includes(searchLower) ||
         cuti.user?.email?.toLowerCase().includes(searchLower) ||
         cuti.alasan?.toLowerCase().includes(searchLower);
});



const totalPagesApproval = Math.ceil(filteredApprovalCuti.length / itemsPerPageApproval);
const paginatedApprovalCuti = filteredApprovalCuti.slice(
  (currentPageApproval - 1) * itemsPerPageApproval,
  currentPageApproval * itemsPerPageApproval
);

const handleSearchApproval = (value) => {
  setSearchApproval(value);
  setCurrentPageApproval(1);
};

const handlePageChangeApproval = (page) => {
  setCurrentPageApproval(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

// ✅ TAMBAHAN: Fungsi untuk mendapatkan badge status dengan ikon
const getStatusBadgeWithIcon = (status) => {
  const config = {
    'diproses': { 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200',
      text: 'text-yellow-700', 
      icon: Clock,
      label: 'Menunggu' 
    },
    'disetujui': { 
      bg: 'bg-green-50', 
      border: 'border-green-200',
      text: 'text-green-700', 
      icon: CheckCircle,
      label: 'Disetujui' 
    },
    'ditolak': { 
      bg: 'bg-red-50', 
      border: 'border-red-200',
      text: 'text-red-700', 
      icon: XCircle,
      label: 'Ditolak' 
    }
  };
  
  const item = config[status] || config['diproses'];
  const Icon = item.icon;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${item.bg} ${item.border}`}>
      <Icon className={`w-3.5 h-3.5 ${item.text}`} />
      <span className={`text-xs font-semibold ${item.text}`}>{item.label}</span>
    </div>
  );
};

// ✅ FIX: Pastikan cutiList adalah array

// ✅ TAMBAHAN: Fungsi untuk validasi hierarki
const canApproveAsAtasan = (cuti) => {
  const cutiAtasanId = parseInt(cuti.diketahui_atasan);
  const userId = parseInt(currentUserId);
  return cutiAtasanId === userId && 
         cuti.status_diketahui_atasan === 'diproses' &&
         cuti.status_final === 'diproses';
};

const canApproveAsHRD = (cuti) => {
  const cutiHrdId = parseInt(cuti.diketahui_hrd);
  const userId = parseInt(currentUserId);
  
  if (cutiHrdId !== userId || 
      cuti.status_diketahui_hrd !== 'diproses' || 
      cuti.status_final !== 'diproses') {
    return false;
  }
  
  // ✅ VALIDASI HIERARKI: HRD hanya bisa approve jika atasan sudah approve
  if (cuti.diketahui_atasan) {
    return cuti.status_diketahui_atasan === 'disetujui';
  }
  
  return true;
};

const canApproveAsPimpinan = (cuti) => {
  const cutiPimpinanId = parseInt(cuti.disetujui);
  const userId = parseInt(currentUserId);
  
  if (cutiPimpinanId !== userId || 
      cuti.status_disetujui !== 'diproses' || 
      cuti.status_final !== 'diproses') {
    return false;
  }
  
  // ✅ VALIDASI HIERARKI: Pimpinan hanya bisa approve jika atasan & HRD sudah approve
  if (cuti.diketahui_atasan && cuti.status_diketahui_atasan !== 'disetujui') {
    return false;
  }
  if (cuti.diketahui_hrd && cuti.status_diketahui_hrd !== 'disetujui') {
    return false;
  }
  
  return true;
};

// ✅ TAMBAHAN: Fungsi untuk mendapatkan pesan hierarki
const getHierarchyMessage = (cuti, approvalType) => {
  if (approvalType === 'hrd' && cuti.diketahui_atasan) {
    if (cuti.status_diketahui_atasan !== 'disetujui') {
      return 'Menunggu persetujuan Atasan';
    }
  }
  
  if (approvalType === 'pimpinan') {
    const pending = [];
    if (cuti.diketahui_atasan && cuti.status_diketahui_atasan !== 'disetujui') {
      pending.push('Atasan');
    }
    if (cuti.diketahui_hrd && cuti.status_diketahui_hrd !== 'disetujui') {
      pending.push('HRD');
    }
    if (pending.length > 0) {
      return `Menunggu persetujuan ${pending.join(' dan ')}`;
    }
  }
  
  return null;
};

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
  
// ✅ FUNGSI: Mendapatkan status hierarki lengkap dengan validasi
const getApprovalHierarchyStatus = (cuti) => {
  const hierarchy = [];
  
  // Level 1: Atasan
  if (cuti.diketahui_atasan) {
    hierarchy.push({
      level: 1,
      role: 'Atasan',
      user: cuti.diketahui_atasan_user,
      status: cuti.status_diketahui_atasan,
      canApprove: canApproveAsAtasan(cuti),
      isBlocked: false // Atasan tidak pernah diblok
    });
  }
  
  // Level 2: HRD
  if (cuti.diketahui_hrd) {
    // ✅ HRD diblok jika ada atasan dan atasan belum approve
    const isBlocked = cuti.diketahui_atasan && cuti.status_diketahui_atasan !== 'disetujui';
    
    hierarchy.push({
      level: hierarchy.length + 1,
      role: 'HRD',
      user: cuti.diketahui_hrd_user,
      status: cuti.status_diketahui_hrd,
      canApprove: canApproveAsHRD(cuti),
      isBlocked: isBlocked
    });
  }
  
  // Level 3: Pimpinan
  if (cuti.disetujui) {
    // ✅ Pimpinan diblok jika ada atasan/HRD yang belum approve
    let isBlocked = false;
    const blockReasons = [];
    
    if (cuti.diketahui_atasan && cuti.status_diketahui_atasan !== 'disetujui') {
      isBlocked = true;
      blockReasons.push('Atasan');
    }
    if (cuti.diketahui_hrd && cuti.status_diketahui_hrd !== 'disetujui') {
      isBlocked = true;
      blockReasons.push('HRD');
    }
    
    hierarchy.push({
      level: hierarchy.length + 1,
      role: 'Pimpinan',
      user: cuti.disetujui_user,
      status: cuti.status_disetujui,
      canApprove: canApproveAsPimpinan(cuti),
      isBlocked: isBlocked,
      blockReasons: blockReasons
    });
  }
  
  return hierarchy;
};

  const submitApproval = () => {
    if (!confirmAction) return;
    if (confirmAction.status === 'ditolak' && !catatan.trim()) {
      toast.warning('Catatan wajib diisi saat menolak pengajuan cuti');
      return;
    }

    setLoadingOverlay(true);
    router.post('/hrd/cuti/approval', {
      pemakaian_cuti_id: confirmAction.cutiId,
      approval_type: confirmAction.approvalType,
      status: confirmAction.status,
      catatan: catatan
    }, {
      onSuccess: () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
        setCatatan('');
        setShowDetailModal(false);
        setSelectedCuti(null);
        setLoadingOverlay(false);
        toast.success(`Pengajuan cuti berhasil ${confirmAction.status === 'disetujui' ? 'disetujui' : 'ditolak'}!`);
        router.reload({ only: ['jatahCuti', 'pemakaianCuti'] });
      },
      onError: () => {
        setLoadingOverlay(false);
        toast.error('Terjadi kesalahan saat memproses persetujuan');
      }
    });
  };

  const openDetailModal = (cuti) => {
    setSelectedCuti(cuti);
    setShowDetailModal(true);
  };

  const handleDownloadPdf = (cutiId) => {
    window.open(`/cuti/download-pdf/${cutiId}`, '_blank');
  };

  const handlePageChange = (url) => {
    if (url) {
      setLoadingOverlay(true);
      router.get(url, {}, {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => setLoadingOverlay(false),
        onError: () => {
          toast.error('Gagal memuat data.');
          setLoadingOverlay(false);
        }
      });
    }
  };

  // Filter pengajuan cuti untuk tab 1
 const filteredPengajuanCuti = cutiListData.filter(cuti => {
  if (!searchPengajuan) return true;
  const searchLower = searchPengajuan.toLowerCase();
  return cuti.user?.name?.toLowerCase().includes(searchLower) ||
         cuti.user?.email?.toLowerCase().includes(searchLower) ||
         cuti.alasan?.toLowerCase().includes(searchLower);
});


  const handleApproval = (cutiId, approvalType, status) => {
  // ✅ FIX: Gunakan cutiListData yang sudah di-fix
  const cuti = cutiListData.find(c => c.id === cutiId);
  
  if (!cuti) {
    showToast('Data cuti tidak ditemukan', 'error');
    return;
  }
  
  if (cuti.status_final === 'ditolak' || cuti.status_final === 'disetujui') {
    showToast('Status pengajuan ini sudah final dan tidak dapat diubah lagi.', 'warning');
    return;
  }

  // ✅ Mapping role ke approval_type yang benar
  let mappedApprovalType = approvalType.toLowerCase();
  
  setConfirmAction({
    cutiId,
    approvalType: mappedApprovalType,
    status,
    cuti
  });
  setCatatan('');
  setShowConfirmModal(true);
};
  const totalPagesPengajuan = Math.ceil(filteredPengajuanCuti.length / itemsPerPagePengajuan);
  const paginatedPengajuanCuti = filteredPengajuanCuti.slice(
    (currentPagePengajuan - 1) * itemsPerPagePengajuan,
    currentPagePengajuan * itemsPerPagePengajuan
  );

  const pendingApprovals = cutiListData.filter(cuti => {
  if (cuti.status_final !== 'diproses') return false;
  
  const isAtasan = cuti.diketahui_atasan === currentUserId && cuti.status_diketahui_atasan === 'diproses';
  const isHRD = cuti.diketahui_hrd === currentUserId && cuti.status_diketahui_hrd === 'diproses' && canApproveAsHRD(cuti);
  const isPimpinan = cuti.disetujui === currentUserId && cuti.status_disetujui === 'diproses' && canApproveAsPimpinan(cuti);
  
  return isAtasan || isHRD || isPimpinan;
}).length || 0;


  // Fungsi untuk form pengajuan cuti
  const openFormModal = () => {
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
    setWorkDays(0);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      if (name === 'cuti_setengah_hari') {
        if (checked) {
          if (updated.tanggal_mulai) {
            updated.tanggal_selesai = updated.tanggal_mulai;
            calculateWorkDays(updated.tanggal_mulai, updated.tanggal_mulai, true);
          }
        } else {
          if (updated.tanggal_mulai && updated.tanggal_selesai) {
            calculateWorkDays(updated.tanggal_mulai, updated.tanggal_selesai, false);
          }
        }
      }
      
      if (name === 'tanggal_mulai') {
        if (value) {
          if (updated.cuti_setengah_hari) {
            updated.tanggal_selesai = value;
            calculateWorkDays(value, value, true);
          } else if (updated.tanggal_selesai) {
            calculateWorkDays(value, updated.tanggal_selesai, false);
          }
        }
      }
      
      if (name === 'tanggal_selesai') {
        if (value && updated.tanggal_mulai) {
          if (updated.cuti_setengah_hari) {
            updated.tanggal_selesai = updated.tanggal_mulai;
            calculateWorkDays(updated.tanggal_mulai, updated.tanggal_mulai, true);
          } else {
            calculateWorkDays(updated.tanggal_mulai, value, false);
          }
        }
      }
      
      return updated;
    });
  };

  const calculateWorkDays = (startDate, endDate, isHalfDay) => {
    if (!startDate || !endDate) {
      setWorkDays(0);
      return;
    }

    if (isHalfDay) {
      setWorkDays(0.5);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    let current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    setWorkDays(count);
  };

  const handleSubmitCuti = (e) => {
    e.preventDefault();
    
    if (!formData.diketahui_atasan && !formData.diketahui_hrd && !formData.disetujui) {
      toast.warning('Pilih minimal satu approver (Atasan, HRD, atau Pimpinan)');
      return;
    }
    
    if (new Date(formData.tanggal_selesai) < new Date(formData.tanggal_mulai)) {
      toast.warning('Tanggal selesai tidak boleh lebih awal dari tanggal mulai');
      return;
    }
    
    if (workDays <= 0) {
      toast.warning('Durasi cuti tidak valid. Pastikan tanggal sudah dipilih dengan benar.');
      return;
    }

    setLoadingOverlay(true);
    
    router.post('/cuti/store', formData, {
      onSuccess: () => {
        closeFormModal();
        setLoadingOverlay(false);
        toast.success('Pengajuan cuti berhasil disimpan!');
        router.reload({ only: ['jatahCuti', 'pemakaianCuti'] });
      },
      onError: (errors) => {
        console.error('Validation errors:', errors);
        setLoadingOverlay(false);
        if (errors.error) {
          toast.error(errors.error);
        } else {
          toast.error('Terjadi kesalahan saat mengajukan cuti');
        }
      }
    });
  };

  const getAvailableApprovers = () => {
    if (!users || users.length === 0) return [];
    return users.filter(user => parseInt(user.id) !== parseInt(currentUserId));
  };

  // Filter jatah cuti yang bisa digunakan
  const getAvailableJatahCuti = () => {
    if (!jatahCuti || jatahCuti.length === 0) return [];
    return jatahCuti.filter(jatah => {
      const sisaCuti = parseFloat(jatah.sisa_cuti);
      return sisaCuti > 0 && (jatah.is_current || jatah.is_borrowable);
    });
  };

  return (
    <LayoutTemplate>
      <Head title="Cuti - Head/Atasan" />

      <div className=" max-w-7xl mx-auto">
       
        {/* Informasi Jatah Cuti (jika ada) */}
        {jatahCuti.length > 0 && jatahCuti[0] && (
          <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-600 text-white">
              <h2 className="text-xl font-semibold">Informasi Jatah Cuti Saya</h2>
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
                      : {jatahCuti[0].tmk ? formatDate(jatahCuti[0].tmk) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-gray-700">Hak cuti sebenarnya</td>
                    <td className="py-2 text-sm text-gray-900 font-medium">
                      : {formatHari(jatahCuti[0].jumlah_cuti)} hari
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-gray-700">Telah terpakai</td>
                    <td className="py-2 text-sm text-gray-900 font-medium">: {formatHari(jatahCuti[0].cuti_dipakai) || '0'} hari</td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="py-2 text-sm font-semibold text-gray-900">Sisa cuti</td>
                    <td className="py-2 text-sm font-bold text-blue-600">: {formatHari(jatahCuti[0].sisa_cuti)} hari</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Tab Content: Pengajuan Cuti */}
        {activeTab === 'pengajuan' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                <div className="flex-1 relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama, email, atau alasan..."
                    value={searchPengajuan}
                    onChange={(e) => setSearchPengajuan(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={openFormModal}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  Ajukan Cuti
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karyawan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode Cuti</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Atasan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status HRD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Pimpinan</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPengajuanCuti.length > 0 ? (
                    paginatedPengajuanCuti.map((cuti, index) => {
                      const hierarchy = getApprovalHierarchyStatus(cuti);
                      
                      return (
                        <tr key={cuti.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(currentPagePengajuan - 1) * itemsPerPagePengajuan + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{cuti.user?.name}</div>
                            <div className="text-sm text-gray-500">{formatDate(cuti.tanggal_pengajuan)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(cuti.tanggal_mulai)} - {formatDate(cuti.tanggal_selesai)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-blue-600">
                                {cuti.jumlah_hari} hari
                              </span>
                              {cuti.cuti_setengah_hari && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                  1/2 Hari
                                </span>
                              )}
                            </div>
                          </td>
                            
                          {/* ✅ KOLOM HIERARKI APPROVAL - BARU */}
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
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openDetailModal(cuti)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadPdf(cuti.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {cuti.status_final === 'ditolak' && (
                                <button
                                  onClick={() => handleDeletePengajuan(cuti.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Hapus Pengajuan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        {searchPengajuan ? 'Tidak ada hasil yang ditemukan' : 'Belum ada pengajuan cuti'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {pemakaianCuti?.data && pemakaianCuti.data.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="text-sm text-gray-700">
                    Menampilkan{' '}
                    <span className="font-medium">{pemakaianCuti.from || 0}</span>
                    {' '}-{' '}
                    <span className="font-medium">{pemakaianCuti.to || 0}</span>
                    {' '}dari{' '}
                    <span className="font-medium">{pemakaianCuti.total || 0}</span>
                    {' '}pengajuan
                  </div>
                  
                  <div className="flex gap-2">
                    {paginationLinks && paginationLinks.map((link, index) => {
                      if (link.url === null) {
                        return (
                          <button
                            key={index}
                            disabled
                            className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100 text-gray-400 cursor-not-allowed"
                          >
                            {link.label === '&laquo; Previous' ? (
                              <ChevronLeft className="w-4 h-4" />
                            ) : link.label === 'Next &raquo;' ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            )}
                          </button>
                        );
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => handlePageChange(link.url)}
                          className={`px-3 py-2 text-sm border rounded transition-colors ${
                            link.active
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {link.label === '&laquo; Previous' ? (
                            <ChevronLeft className="w-4 h-4" />
                          ) : link.label === 'Next &raquo;' ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        

        {/* Modal Form Pengajuan Cuti */}
        {showFormModal && (
          <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Ajukan Cuti</h3>
                </div>
                <button
                  onClick={closeFormModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitCuti} className="p-6 space-y-4">
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
                    <option value="">Pilih Periode Cuti</option>
                    {getAvailableJatahCuti().map((jatah) => (
                      <option key={jatah.id} value={jatah.id}>
                        Tahun ke-{jatah.tahun_ke} - Sisa: {formatHari(jatah.sisa_cuti)} hari
                        {jatah.is_borrowable ? ' (Pinjam periode depan)' : ''}
                      </option>
                    ))}
                  </select>
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
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
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
                      min={formData.tanggal_mulai}
                      disabled={formData.cuti_setengah_hari}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    />
                  </div>
                </div>

                {/* Info Durasi */}
                {workDays > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">Durasi Cuti:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600">
                          {workDays === 0.5 ? '0.5 hari' : `${Math.round(workDays)} hari`}
                        </span>
                        {workDays === 0.5 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                            Setengah Hari
                          </span>
                        )}
                      </div>
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
                </div>

                {/* Delegasi Tugas (Opsional) */}
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Pilih Penerima Tugas</option>
                      {getAvailableApprovers().map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
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
                        rows="2"
                        placeholder="Jelaskan tugas yang akan didelegasikan..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Alur Persetujuan */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Alur Persetujuan <span className="text-red-500 text-xs">(Minimal pilih 1)</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diketahui Atasan
                      </label>
                      <select
                        name="diketahui_atasan"
                        value={formData.diketahui_atasan}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Pilih Atasan</option>
                        {getAvailableApprovers().map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diketahui HRD
                      </label>
                      <select
                        name="diketahui_hrd"
                        value={formData.diketahui_hrd}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Pilih HRD</option>
                        {getAvailableApprovers().map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Disetujui Pimpinan
                      </label>
                      <select
                        name="disetujui"
                        value={formData.disetujui}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Pilih Pimpinan</option>
                        {getAvailableApprovers().map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

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
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Ajukan Cuti
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Detail Pengajuan */}
        {showDetailModal && selectedCuti && (
          <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">STATUS PENGAJUAN:</span>
                    {getStatusFinalBadge(selectedCuti.status_final)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Informasi Karyawan</h4>
                  </div>
                  <p className="text-lg font-medium text-gray-900">{selectedCuti.user?.name}</p>
                  <p className="text-sm text-gray-600">{selectedCuti.user?.email}</p>
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Durasi Cuti:</span>
                    <span className="text-lg font-bold text-blue-600">{formatHari(selectedCuti.jumlah_hari)} hari</span>
                  </div>
                </div>

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

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Status Persetujuan</h4>
                  <div className="space-y-3">
                    {selectedCuti.diketahui_atasan_user && (
                      <div className="rounded-lg p-4 bg-gray-50">
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
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Setujui
                            </button>
                            <button
                              onClick={() => handleApproval(selectedCuti.id, 'atasan', 'ditolak')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                              Tolak
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCuti.diketahui_hrd_user && (
                      <div className="rounded-lg p-4 bg-gray-50">
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
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Setujui
                            </button>
                            <button
                              onClick={() => handleApproval(selectedCuti.id, 'hrd', 'ditolak')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                              Tolak
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCuti.disetujui_user && (
                      <div className="rounded-lg p-4 bg-gray-50">
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
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Setujui
                            </button>
                            <button
                              onClick={() => handleApproval(selectedCuti.id, 'pimpinan', 'ditolak')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

        {/* Modal Konfirmasi Approval */}
        {showConfirmModal && confirmAction && (
          <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">
                  {confirmAction.status === 'disetujui' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
                </h3>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                    setCatatan('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className={`p-4 rounded-lg ${
                  confirmAction.status === 'disetujui' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-sm text-gray-700">
                    Anda akan <strong className={confirmAction.status === 'disetujui' ? 'text-green-700' : 'text-red-700'}>
                      {confirmAction.status === 'disetujui' ? 'menyetujui' : 'menolak'}
                    </strong> pengajuan cuti dari:
                  </p>
                  <p className="text-base font-semibold text-gray-900 mt-2">
                    {confirmAction.cuti?.user?.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(confirmAction.cuti?.tanggal_mulai)} - {formatDate(confirmAction.cuti?.tanggal_selesai)} ({formatHari(confirmAction.cuti?.jumlah_hari)} hari)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan {confirmAction.status === 'ditolak' ? <span className="text-red-600">*</span> : '(Opsional)'}
                  </label>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder={
                      confirmAction.status === 'disetujui' 
                        ? 'Tambahkan catatan persetujuan (opsional)...' 
                        : 'Alasan penolakan wajib diisi...'
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-none ${
                      confirmAction.status === 'ditolak' 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    rows="4"
                    maxLength="500"
                  />
                  {confirmAction.status === 'ditolak' && (
                    <p className="text-xs text-red-600 mt-1">
                      * Catatan wajib diisi saat menolak pengajuan
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {catatan.length}/500 karakter
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                    setCatatan('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={submitApproval}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    confirmAction.status === 'disetujui'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {confirmAction.status === 'disetujui' ? 'Ya, Setujui' : 'Ya, Tolak'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loadingOverlay && (
          <div style={{margin:"0px", padding:"0px"}} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800 mb-1">Loading</p>
                <p className="text-sm text-gray-600">Mohon tunggu sebentar...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutTemplate>
  );
}

export default CutiHead;