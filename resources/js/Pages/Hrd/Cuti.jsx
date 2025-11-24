import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Calculator, CheckCircle, XCircle, Eye, Clock, User, Save, Download } from 'lucide-react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Cuti({ jatahCuti, users, tahunList, filters = {}, pemakaianCuti = [], auth }) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedData, setSelectedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [selectedTahun, setSelectedTahun] = useState(filters?.tahun || '');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCuti, setSelectedCuti] = useState(null);
  const [activeTab, setActiveTab] = useState('pengajuan');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUserGroup, setSelectedUserGroup] = useState(null);
  const [searchPengajuan, setSearchPengajuan] = useState('');
  const [currentPagePengajuan, setCurrentPagePengajuan] = useState(1);
  const itemsPerPagePengajuan = 10;
  const [searchJatah, setSearchJatah] = useState('');
  const [currentPageJatah, setCurrentPageJatah] = useState(1);
  const itemsPerPageJatah = 9; 
const [showEditStatusModal, setShowEditStatusModal] = useState(false);
const [selectedCutiForEdit, setSelectedCutiForEdit] = useState(null);
const [editStatusData, setEditStatusData] = useState({
  status_final: '',
  catatan: ''
});

  const [showFormModalAdmin, setShowFormModalAdmin] = useState(false);
  const [selectedUserForCuti, setSelectedUserForCuti] = useState(null);
  const [jatahCutiForUser, setJatahCutiForUser] = useState([]);

  const [showSelectUserModal, setShowSelectUserModal] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  
  const currentUserRole = auth?.user?.role;
  const isHeadRole = currentUserRole === 'head';

  const [loadingOverlay, setLoadingOverlay] = useState(false);  

  useEffect(() => {
    const interval = setInterval(() => {
      router.reload({ 
        only: ['pemakaianCuti', 'jatahCuti'],
        preserveScroll: true,
        preserveState: true
      });
    }, 30000); // Refresh setiap 30 detik

    return () => clearInterval(interval);
  }, []);

const formatCutiNumber = (num) => { 
  return Math.round(parseFloat(num || 0));
};
  const openFormModalAdminFromPengajuan = () => {
  setShowSelectUserModal(true);
  setSearchUser('');
};

// ✅ TAMBAHKAN INI setelah semua useState
useEffect(() => {
  const refreshCsrfToken = async () => {
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
        }
      }
    } catch (error) {
      console.error('Error refreshing CSRF token:', error);
    }
  };

  refreshCsrfToken();
}, []);
const selectUserAndOpenForm = async (userGroup) => {
  setShowSelectUserModal(false);
  openFormModalAdmin(userGroup);
};
const handleDownloadPdf = (cutiId) => {
  window.open(route('cuti.download-pdf', cutiId), '_blank');
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

const handleDeletePengajuan = (cutiId) => {
  const cuti = pemakaianCutiArray.find(c => c.id === cutiId);
  
  if (!cuti) {
    showToast('Data pengajuan cuti tidak ditemukan', 'error');
    return;
  }

  // ✅ PERBAIKAN: Hanya cek jika sudah disetujui, tidak perlu cek ditolak
  if (cuti.status_final === 'disetujui') {
    showToast('Tidak dapat menghapus pengajuan cuti yang sudah disetujui', 'warning');
    return;
  }

  const statusText = cuti.status_final === 'ditolak' ? 'Ditolak' : 'Diproses';
  const confirmMessage = `Apakah Anda yakin ingin menghapus pengajuan cuti ini?\n\n` +
    `Karyawan: ${cuti.user?.name}\n` +
    `Tanggal: ${formatDate(cuti.tanggal_mulai)} - ${formatDate(cuti.tanggal_selesai)}\n` +
    `Status: ${statusText}`;

  if (confirm(confirmMessage)) {
    setLoadingOverlay(true);
    router.delete(route('cuti.destroy-pengajuan', cutiId), {
      onSuccess: () => {
        setLoadingOverlay(false);
        showToast('Pengajuan cuti berhasil dihapus!', 'success');
        router.reload({ only: ['jatahCuti', 'pemakaianCuti'] });
      },
      onError: (errors) => {
        console.error('Delete errors:', errors);
        setLoadingOverlay(false);
        if (errors.error) {
          showToast(errors.error, 'error');
        } else {
          showToast('Terjadi kesalahan saat menghapus pengajuan cuti', 'error');
        }
      }
    });
  }
};

const getAvailableApprovers = (selectedUserId) => {
  if (!selectedUserId) return users;
  return users.filter(user => 
    parseInt(user.id) !== parseInt(selectedUserId) 
  );
};


const [formData, setFormData] = useState({
  // ... state yang sudah ada ...
  jatah_cuti_id: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
  cuti_setengah_hari: false,
  alasan: '',
  id_penerima_tugas: '',
  tugas: '',
  diketahui_atasan: '',
  diketahui_hrd: '',
  disetujui: '',
});

const [workDays, setWorkDays] = useState(0);
// Function untuk buka modal edit status
const openEditStatusModal = (cuti) => {
  setSelectedCutiForEdit(cuti);
  setEditStatusData({
    status_final: cuti.status_final || 'diproses',
    catatan: ''
  });
  setShowEditStatusModal(true);
};

// Function untuk submit edit status
const handleSubmitEditStatus = () => {
  if (editStatusData.status_final === 'ditolak' && !editStatusData.catatan.trim()) {
    showToast('Catatan wajib diisi saat menolak pengajuan cuti', 'warning');
    return;
  }

  setLoadingOverlay(true);
  
  router.post(route('hrd.cuti.updateStatusDirect', selectedCutiForEdit.id), editStatusData, {
    onSuccess: () => {
      setShowEditStatusModal(false);
      setSelectedCutiForEdit(null);
      setEditStatusData({ status_final: '', catatan: '' });
      setLoadingOverlay(false);
      showToast('Status pengajuan cuti berhasil diubah!', 'success');
      router.reload({ only: ['jatahCuti', 'pemakaianCuti'] });
    },
    onError: (errors) => {
      setLoadingOverlay(false);
      if (errors.error) {
        showToast(errors.error, 'error');
      } else {
        showToast('Terjadi kesalahan saat mengubah status', 'error');
      }
    }
  });
};

  const currentUserId = auth?.user?.id;

  const handleSearch = (value) => {
  setSearchTerm(value);
  router.get(route('perizinan.cuti'), { 
    search: value, 
    tahun: selectedTahun 
  }, { 
    preserveState: true,
    preserveScroll: true,        
    only: ['jatahCuti']         
  });
};

const handleSearchJatah = (value) => {
  setSearchJatah(value);
  setCurrentPageJatah(1);
};

const handlePageChangeJatah = (page) => {
  setCurrentPageJatah(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
    showToast('Pilih user dan tahun terlebih dahulu', 'warning'); // ← UBAH INI
    return;
  }

  setLoadingOverlay(true); // ← TAMBAH INI
  try {
    const response = await fetchWithCsrf(route('hrd.cuti.calculate'), {
      method: 'POST',
      body: JSON.stringify({
        uid: formData.uid,
        tahun: formData.tahun
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      showToast(`Error ${response.status}: Gagal menghitung cuti.`, 'error'); // ← UBAH INI
      setLoadingOverlay(false); // ← TAMBAH INI
      return;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await response.text();
      console.error('Not JSON response:', errorText);
      showToast('Server mengembalikan format yang salah.', 'error'); // ← UBAH INI
      setLoadingOverlay(false); // ← TAMBAH INI
      return;
    }

    const data = await response.json();    
    if (!data || !data.success) {
      showToast(data.error || 'Gagal mendapatkan data dari server', 'error'); // ← UBAH INI
      setLoadingOverlay(false); // ← TAMBAH INI
      return;
    }

    if (data.is_duplicate) {
      showToast(`Periode tahun ke-${data.tahun_ke} untuk karyawan ini sudah ada.`, 'warning'); // ← UBAH INI
      setLoadingOverlay(false); // ← TAMBAH INI
      return;
    }

    const isDuplicate = jatahCuti.data.some(item => 
      parseInt(item.uid) === parseInt(formData.uid) && 
      parseInt(item.tahun_ke) === parseInt(data.tahun_ke)
    );

    if (isDuplicate) {
      showToast(`Periode tahun ke-${data.tahun_ke} untuk karyawan ini sudah ada.`, 'warning'); // ← UBAH INI
      setLoadingOverlay(false); // ← TAMBAH INI
      return;
    }

    setFormData(prev => ({
      ...prev,
      tahun_ke: data.tahun_ke,
      jumlah_cuti: data.jumlah_cuti,
      sisa_cuti: data.jumlah_cuti,
      cuti_dipakai: 0
    }));

    showToast('Jatah cuti berhasil dihitung!', 'success'); // ← UBAH INI
    setLoadingOverlay(false); // ← TAMBAH INI
    
  } catch (error) {
    console.error('Error calculating cuti:', error);
    showToast('Terjadi kesalahan: ' + error.message, 'error'); // ← UBAH INI
    setLoadingOverlay(false); // ← TAMBAH INI
  }
};

const handleSubmit = () => {
  if (!formData.uid) {
    showToast('Pilih karyawan terlebih dahulu', 'warning'); // ← UBAH INI
    return;
  }
  
  if (!formData.tahun) {
    showToast('Masukkan tahun terlebih dahulu', 'warning'); // ← UBAH INI
    return;
  }
  
  if (!formData.jumlah_cuti || parseFloat(formData.jumlah_cuti) <= 0) {
    showToast('Jumlah cuti harus lebih dari 0', 'warning'); // ← UBAH INI
    return;
  }

  setLoadingOverlay(true); // ← TAMBAH INI

  if (modalType === 'create') {
    router.post(route('hrd.cuti.store'), formData, {
      onSuccess: () => {
        closeModal();
        setLoadingOverlay(false); // ← TAMBAH INI
        showToast('Jatah cuti berhasil disimpan!', 'success'); // ← TAMBAH INI
        router.reload({ only: ['jatahCuti', 'pemakaianCuti'] });
      },
      onError: (errors) => {
        console.error('Validation errors:', errors);
        setLoadingOverlay(false); // ← TAMBAH INI
        if (errors.message) {
          showToast(errors.message, 'error'); // ← UBAH INI
        } else if (errors.error) {
          showToast(errors.error, 'error'); // ← UBAH INI
        } else {
          showToast('Terjadi kesalahan saat menyimpan data.', 'error'); // ← UBAH INI
        }
      }
    });
  } else {
    router.put(route('hrd.cuti.update', selectedData.id), formData, {
      onSuccess: () => {
        closeModal();
        setLoadingOverlay(false); // ← TAMBAH INI
        showToast('Jatah cuti berhasil diupdate!', 'success'); // ← UBAH INI
        router.reload({ only: ['jatahCuti', 'pemakaianCuti'] });
      },
      onError: (errors) => {
        console.error('Validation errors:', errors);
        setLoadingOverlay(false); // ← TAMBAH INI
        if (errors.message) {
          showToast(errors.message, 'error'); // ← UBAH INI
        } else if (errors.error) {
          showToast(errors.error, 'error'); // ← UBAH INI
        } else {
          showToast('Terjadi kesalahan saat mengupdate data.', 'error'); // ← UBAH INI
        }
      }
    });
  }
};

  const openFormModalAdmin = async (userGroup) => {
  setSelectedUserForCuti(userGroup);
  
  // Filter jatah cuti yang tersedia
  const tmk = new Date(userGroup.user.tmk);
  const today = new Date();
  const yearsDiff = today.getFullYear() - tmk.getFullYear();
  const monthDiff = today.getMonth() - tmk.getMonth();
  const dayDiff = today.getDate() - tmk.getDate();
  
  let activePeriod = yearsDiff;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    activePeriod--;
  }
  
  
const availableCuti = userGroup.cutiList.filter(item => {
  const sisaCuti = parseFloat(item.sisa_cuti);
  const tahunKe = parseInt(item.tahun_ke);
  
  // Izinkan semua periode yang masih punya sisa cuti
  if (sisaCuti > 0) {
    // Periode sebelumnya (jika ada sisa, boleh dipakai)
    if (tahunKe < activePeriod) return true;
    
    // Periode aktif (selalu boleh)
    if (tahunKe === activePeriod) return true;
    
    // Periode depan (pinjam cuti tahun depan, hanya jika sudah tahun ke-1 atau lebih)
    if (tahunKe === activePeriod + 1 && activePeriod >= 1) return true;
  }
  
  return false;
}).map(item => ({
  ...item,
  is_current: parseInt(item.tahun_ke) === activePeriod,
  is_previous: parseInt(item.tahun_ke) < activePeriod, 
  is_borrowable: parseInt(item.tahun_ke) === activePeriod + 1 && activePeriod >= 1
}));
  
  setJatahCutiForUser(availableCuti);
  const initialFormData = {
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
  };
  
  setFormData(initialFormData);
  setWorkDays(0);
  setShowFormModalAdmin(true);
};



const closeFormModalAdmin = () => {
  setShowFormModalAdmin(false);
  setSelectedUserForCuti(null);
  setJatahCutiForUser([]);
  
  // Reset form data ke state awal
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
};


// ========================================
// FUNGSI HANDLE SUBMIT ADMIN (UPDATE)
// ========================================

const handleSubmitAdmin = (e) => {
  e.preventDefault();
  
  if (!formData.diketahui_atasan && !formData.diketahui_hrd && !formData.disetujui) {
    showToast('Pilih minimal satu approver (Atasan, HRD, atau Pimpinan)', 'warning'); // ← UBAH INI
    return;
  }
  
  if (new Date(formData.tanggal_selesai) < new Date(formData.tanggal_mulai)) {
    showToast('Tanggal selesai tidak boleh lebih awal dari tanggal mulai', 'warning'); // ← UBAH INI
    return;
  }
  
  if (workDays <= 0) {
    showToast('Durasi cuti tidak valid. Pastikan tanggal sudah dipilih dengan benar.', 'warning'); // ← UBAH INI
    return;
  }

  const selectedUserId = parseInt(selectedUserForCuti.user.id);
  const atasanId = formData.diketahui_atasan ? parseInt(formData.diketahui_atasan) : null;
  const hrdId = formData.diketahui_hrd ? parseInt(formData.diketahui_hrd) : null;
  const pimpinanId = formData.disetujui ? parseInt(formData.disetujui) : null;

  if (atasanId === selectedUserId || hrdId === selectedUserId || pimpinanId === selectedUserId) {
    showToast('User tidak dapat menjadi approver untuk pengajuan cutinya sendiri. Pilih approver yang berbeda.', 'warning'); // ← UBAH INI
    return;
  }
  
  const selectedJatahCuti = jatahCutiForUser.find(j => j.id == formData.jatah_cuti_id);
  if (selectedJatahCuti && parseFloat(selectedJatahCuti.sisa_cuti) < workDays) {
    showToast(`Sisa cuti tidak mencukupi. Sisa: ${selectedJatahCuti.sisa_cuti} hari, Dibutuhkan: ${workDays} hari`, 'warning'); // ← UBAH INI
    return;
  }

  setLoadingOverlay(true); // ← TAMBAH INI
  
  const submitData = {
    ...formData,
    uid: selectedUserForCuti.user.id 
  };
  
  router.post(route('hrd.cuti.storePengajuanAdmin'), submitData, {
    onSuccess: () => {
      closeFormModalAdmin();
      setLoadingOverlay(false); // ← TAMBAH INI
      showToast('Pengajuan cuti berhasil disimpan!', 'success'); // ← TAMBAH INI
      router.reload({ only: ['jatahCuti', 'pemakaianCuti'] });
    },
    onError: (errors) => {
      console.error('Validation errors:', errors);
      setLoadingOverlay(false); // ← TAMBAH INI
      if (errors.error) {
        showToast(errors.error, 'error'); // ← UBAH INI
      } else {
        showToast('Terjadi kesalahan saat mengajukan cuti', 'error'); // ← UBAH INI
      }
    }
  });
};




const handleDelete = (id) => {
  if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
    setLoadingOverlay(true); // ← TAMBAH INI
    router.delete(route('hrd.cuti.destroy', id), {
      onSuccess: () => {
        setLoadingOverlay(false); // ← TAMBAH INI
        showToast('Data jatah cuti berhasil dihapus!', 'success'); // ← TAMBAH INI
        router.reload({ only: ['jatahCuti', 'pemakaianCuti'] });
      },
      onError: (errors) => {
        setLoadingOverlay(false); // ← TAMBAH INI
        showToast('Terjadi kesalahan saat menghapus data', 'error'); // ← TAMBAH INI
      }
    });
  }
};

  const handleApproval = (cutiId, approvalType, status) => {
  const cuti = pemakaianCuti.find(c => c.id === cutiId);
  if (cuti && (cuti.status_final === 'ditolak' || cuti.status_final === 'disetujui')) {
    showToast('Status pengajuan ini sudah final dan tidak dapat diubah lagi.', 'warning'); // ← UBAH INI
    return;
  }

  setConfirmAction({
    cutiId,
    approvalType,
    status,
    cuti
  });
  setCatatan('');
  setShowConfirmModal(true);
};

const submitApproval = () => {
  if (!confirmAction) return;
  if (confirmAction.status === 'ditolak' && !catatan.trim()) {
    showToast('Catatan wajib diisi saat menolak pengajuan cuti', 'warning'); // ← UBAH INI
    return;
  }

  setLoadingOverlay(true); // ← TAMBAH INI
  router.post(route('hrd.cuti.approval'), {
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
      setLoadingOverlay(false); // ← TAMBAH INI
      showToast(`Pengajuan cuti berhasil ${confirmAction.status === 'disetujui' ? 'disetujui' : 'ditolak'}!`, 'success'); // ← TAMBAH INI
      router.reload({ only: ['jatahCuti', 'pemakaianCuti'] });
    },
    onError: (errors) => {
      setLoadingOverlay(false); // ← TAMBAH INI
      showToast('Terjadi kesalahan saat memproses persetujuan', 'error'); // ← TAMBAH INI
    }
  });
};

const openUserDetailModal = (userGroup) => {
  setSelectedUserGroup(userGroup);
  setShowUserDetailModal(true);
};

const closeUserDetailModal = () => {
  setShowUserDetailModal(false);
  setSelectedUserGroup(null);
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
    if (cuti.diketahui_atasan && cuti.status_diketahui_atasan !== 'disetujui') {
      return false;
    }
    if (cuti.diketahui_hrd && cuti.status_diketahui_hrd !== 'disetujui') {
      return false;
    }

    return true;
  };

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

// ✅ Fungsi 1: fetchFreshCsrfToken
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

// ✅ Fungsi 2: getCsrfToken
const getCsrfToken = () => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  if (!token) {
    console.error('CSRF token tidak ditemukan!');
    return '';
  }
  
  return token;
};

// ✅ Fungsi 3: fetchWithCsrf
const fetchWithCsrf = async (url, options = {}, retries = 1) => {
  let csrfToken = getCsrfToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json'
    },
    credentials: 'same-origin',
    ...options
  };

  try {
    let response = await fetch(url, defaultOptions);

    if (response.status === 419 && retries > 0) {
      const newToken = await fetchFreshCsrfToken();
      
      if (newToken) {
        defaultOptions.headers['X-CSRF-TOKEN'] = newToken;
        response = await fetch(url, defaultOptions);
        
        if (response.status === 419) {
          alert('Session telah berakhir. Halaman akan di-refresh.');
          window.location.reload();
          throw new Error('CSRF token masih invalid');
        }
      } else {
        alert('Gagal memperbarui session. Halaman akan di-refresh.');
        window.location.reload();
        throw new Error('Gagal mendapatkan CSRF token baru');
      }
    }

    return response;
  } catch (error) {
    console.error('Error in fetchWithCsrf:', error);
    throw error;
  }
};
const pemakaianCutiArray = pemakaianCuti || [];

const pendingApprovals = pemakaianCutiArray.filter(cuti => {
  if (cuti.status_final !== 'diproses') return false;
  
  const isAtasan = cuti.diketahui_atasan === currentUserId && cuti.status_diketahui_atasan === 'diproses';
  const isHRD = cuti.diketahui_hrd === currentUserId && cuti.status_diketahui_hrd === 'diproses';
  const isPimpinan = cuti.disetujui === currentUserId && cuti.status_disetujui === 'diproses';
  
  return isAtasan || isHRD || isPimpinan;
}).length || 0;
const handleInputChange = (e) => {
  const { name, value, type, checked } = e.target;
  const newValue = type === 'checkbox' ? checked : value;
  
  setFormData(prev => {
    const updated = { ...prev, [name]: newValue };
    
    // ✅ PERBAIKAN: Handle cuti setengah hari
    if (name === 'cuti_setengah_hari') {
      if (checked) {
        // Jika cuti setengah hari dicentang
        if (updated.tanggal_mulai) {
          // Jika tanggal mulai sudah ada, set tanggal selesai = tanggal mulai
          updated.tanggal_selesai = updated.tanggal_mulai;
          calculateWorkDays(updated.tanggal_mulai, updated.tanggal_mulai, true);
        }
        // Jika tanggal mulai belum ada, tidak perlu calculate (akan calculate nanti saat tanggal dipilih)
      } else {
        // Jika cuti setengah hari di-uncheck
        if (updated.tanggal_mulai && updated.tanggal_selesai) {
          calculateWorkDays(updated.tanggal_mulai, updated.tanggal_selesai, false);
        }
      }
    }
    
    // Auto-calculate work days ketika tanggal berubah
    if (name === 'tanggal_mulai') {
      if (value) { // ✅ TAMBAHAN: Pastikan value tidak kosong
        if (updated.cuti_setengah_hari) {
          // Jika cuti setengah hari, set tanggal selesai = tanggal mulai
          updated.tanggal_selesai = value;
          calculateWorkDays(value, value, true);
        } else if (updated.tanggal_selesai) {
          // Jika tanggal selesai sudah ada, calculate
          calculateWorkDays(value, updated.tanggal_selesai, false);
        }
      }
    }
    
    if (name === 'tanggal_selesai') {
      if (value && updated.tanggal_mulai) { // ✅ TAMBAHAN: Pastikan kedua tanggal ada
        if (updated.cuti_setengah_hari) {
          // Jika cuti setengah hari, tetap gunakan tanggal mulai
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

  // ✅ PERBAIKAN: Jika cuti setengah hari, langsung return 0.5
  if (isHalfDay) {
    setWorkDays(0.5);
    return;
  }

  // ✅ PERBAIKAN: Normalisasi tanggal (set ke jam 00:00:00) untuk menghindari masalah timezone
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  // ✅ PERBAIKAN: Hitung selisih hari dulu
  const timeDiff = end.getTime() - start.getTime();
  const totalDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 karena inklusif

  // ✅ JIKA HANYA 1 HARI (tanggal sama)
  if (totalDays === 1) {
    const dayOfWeek = start.getDay();
    // Cek apakah hari kerja (Senin=1 sampai Jumat=5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      setWorkDays(1);
    } else {
      setWorkDays(0); // Weekend tidak dihitung
    }
    return;
  }

  let count = 0;
  let current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Count only weekdays (Monday=1 to Friday=5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  setWorkDays(count);
};


// Filter & Pagination
const filteredPengajuanCuti = pemakaianCutiArray.filter(cuti => {
  if (!searchPengajuan) return true;
  const searchLower = searchPengajuan.toLowerCase();
  return cuti.user?.name?.toLowerCase().includes(searchLower) ||
         cuti.user?.email?.toLowerCase().includes(searchLower) ||
         cuti.alasan?.toLowerCase().includes(searchLower);
});

const totalPagesPengajuan = Math.ceil(filteredPengajuanCuti.length / itemsPerPagePengajuan);
const paginatedPengajuanCuti = filteredPengajuanCuti.slice(
  (currentPagePengajuan - 1) * itemsPerPagePengajuan,
  currentPagePengajuan * itemsPerPagePengajuan
);

const handleSearchPengajuan = (value) => {
  setSearchPengajuan(value);
  setCurrentPagePengajuan(1);
};

const handlePageChangePengajuan = (page) => {
  setCurrentPagePengajuan(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};


  return (
    <LayoutTemplate>
      <Head title="Izin Cuti" />
      <div className="">
        <div className="">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Manajemen Cuti Karyawan</h1>
          <p className="text-gray-600">Kelola jatah cuti dan persetujuan cuti karyawan</p>
        </div>

        {/* Tab Navigation */}
       <div className="bg-white rounded-xl shadow-md overflow-hidden">
  <div className="flex border-b border-gray-200">
    {/* TAB 1 */}
    <button
      onClick={() => setActiveTab('pengajuan')}
      className={`relative flex-1 px-6 py-4 font-semibold transition-all duration-300 
        ${activeTab === 'pengajuan'
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
        rounded-tl-xl  // kiri atas membulat
      `}
    >
      <div className="flex items-center justify-center gap-2">
        <Clock className="w-5 h-5" />
        <span>Pengajuan Cuti</span>
        {pendingApprovals > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
            {pendingApprovals}
          </span>
        )}
      </div>
      {activeTab === 'pengajuan' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg"></div>
      )}
    </button>

    {/* TAB 2 */}
   {!isHeadRole && (
     <button
      onClick={() => setActiveTab('jatah')}
      className={`relative flex-1 px-6 py-4 font-semibold transition-all duration-300 
        ${activeTab === 'jatah'
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
        rounded-tr-xl  // kanan atas membulat
      `}
    >
      <div className="flex items-center justify-center gap-2">
        <Calculator className="w-5 h-5" />
        <span>Jatah Cuti</span>
      </div>
      {activeTab === 'jatah' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg"></div>
      )}
    </button>
   )}
  </div>
    </div>



        {activeTab === 'jatah' && (
          <>
           <div className="bg-white rounded-lg shadow-sm p-6 ">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama karyawan..."
                  value={searchJatah}
                  onChange={(e) => handleSearchJatah(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchJatah && (
                  <button
                    onClick={() => handleSearchJatah('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <button
                  onClick={() => openModal('create')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Tambah Jatah Cuti
              </button>
            </div>
            {searchJatah && (
              <p className="text-sm text-gray-600 mt-2">
                Ditemukan {(() => {
                  const grouped = Object.values(
                    jatahCuti.data.reduce((acc, item) => {
                      const userId = item.user?.id;
                      if (!acc[userId]) {
                        acc[userId] = { user: item.user, cutiList: [] };
                      }
                      acc[userId].cutiList.push(item);
                      return acc;
                    }, {})
                  );
                  return grouped.filter(userGroup => 
                    userGroup.user?.name?.toLowerCase().includes(searchJatah.toLowerCase())
                  ).length;
                })()} hasil dari pencarian "{searchJatah}"
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const groupedData = Object.values(
                jatahCuti.data.reduce((acc, item) => {
                  const userId = item.user?.id;
                  if (!acc[userId]) {
                    acc[userId] = { user: item.user, cutiList: [] };
                  }
                  acc[userId].cutiList.push(item);
                  return acc;
                }, {})
              );
            
              // Filter based on search
              const filteredData = groupedData.filter(userGroup => 
                !searchJatah || userGroup.user?.name?.toLowerCase().includes(searchJatah.toLowerCase())
              );
            
              // Pagination
              const paginatedData = filteredData.slice(
                (currentPageJatah - 1) * itemsPerPageJatah,
                currentPageJatah * itemsPerPageJatah
              );
            
              return paginatedData.length > 0 ? (
                paginatedData.map((userGroup, idx) => {
                  const tmk = new Date(userGroup.user.tmk);
                  const today = new Date();
                  const yearsDiff = today.getFullYear() - tmk.getFullYear();
                  const monthDiff = today.getMonth() - tmk.getMonth();
                  const dayDiff = today.getDate() - tmk.getDate();
                
                  let activePeriod = yearsDiff;
                  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                    activePeriod--;
                  }
                
                  const aktiveCuti = userGroup.cutiList.find(item => item.tahun_ke === activePeriod);
                  const cutiData = aktiveCuti || userGroup.cutiList[userGroup.cutiList.length - 1];
                
                  const totalJatah = parseFloat(cutiData?.jumlah_cuti || 0);
                  const totalTerpakai = parseFloat(cutiData?.cuti_dipakai || 0);
                  const totalSisa = parseFloat(cutiData?.sisa_cuti || 0);
                
                  return (
                    <div 
                      key={idx} 
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 cursor-pointer"
                      onClick={() => openUserDetailModal(userGroup)}
                    >
                      <div className="p-5" >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {userGroup.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{userGroup.user?.name}</h3>
                            <p className="text-sm text-gray-500">{userGroup.user?.email}</p>
                          </div>
                        </div>
                        <div className="mb-3 text-center">
                          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                            Periode Tahun Ke-{activePeriod}
                          </span>
                        </div>
                  
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-1">Jatah</p>
                            <p className="text-lg font-bold text-blue-600">
                              {formatCutiNumber(totalJatah)} hari
                            </p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-1">Terpakai</p>
                            <p className="text-lg font-bold text-red-600">
                              {formatCutiNumber(totalTerpakai)} hari
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-1">Sisa</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatCutiNumber(totalSisa)} hari
                            </p>
                          </div>
                        </div>
                  
                        <div className="mt-4 text-center">
                          <span className="text-xs text-blue-600 font-medium">
                            Klik untuk melihat detail →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">{searchJatah ? 'Tidak ada hasil yang ditemukan' : 'Tidak ada data jatah cuti'}</p>
                  <p className="text-gray-400 text-sm mt-2">{searchJatah ? 'Coba kata kunci lain' : 'Mulai tambahkan jatah cuti untuk karyawan'}</p>
                </div>
              );
            })()}
          </div>
            {/* Pagination */}
           {/* Pagination untuk Jatah Cuti */}
{(() => {
  const groupedData = Object.values(
    jatahCuti.data.reduce((acc, item) => {
      const userId = item.user?.id;
      if (!acc[userId]) {
        acc[userId] = { user: item.user, cutiList: [] };
      }
      acc[userId].cutiList.push(item);
      return acc;
    }, {})
  );

  const filteredData = groupedData.filter(userGroup => 
    !searchJatah || userGroup.user?.name?.toLowerCase().includes(searchJatah.toLowerCase())
  );

  const totalPagesJatah = Math.ceil(filteredData.length / itemsPerPageJatah);

  return totalPagesJatah > 1 && (
    <div className="mt-6 bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Menampilkan {(currentPageJatah - 1) * itemsPerPageJatah + 1} - {Math.min(currentPageJatah * itemsPerPageJatah, filteredData.length)} dari {filteredData.length} karyawan
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handlePageChangeJatah(currentPageJatah - 1)}
          disabled={currentPageJatah === 1}
          className={`px-3 py-1 text-sm rounded ${
            currentPageJatah === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Previous
        </button>
        
        {[...Array(totalPagesJatah)].map((_, idx) => {
          const pageNum = idx + 1;
          if (
            pageNum === 1 ||
            pageNum === totalPagesJatah ||
            (pageNum >= currentPageJatah - 1 && pageNum <= currentPageJatah + 1)
          ) {
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChangeJatah(pageNum)}
                className={`px-3 py-1 text-sm rounded ${
                  currentPageJatah === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {pageNum}
              </button>
            );
          } else if (
            pageNum === currentPageJatah - 2 ||
            pageNum === currentPageJatah + 2
          ) {
            return <span key={pageNum} className="px-2">...</span>;
          }
          return null;
        })}
        
        <button
          onClick={() => handlePageChangeJatah(currentPageJatah + 1)}
          disabled={currentPageJatah === totalPagesJatah}
          className={`px-3 py-1 text-sm rounded ${
            currentPageJatah === totalPagesJatah
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
})()}
          </>
        )}

        {/* Tab Content: Pengajuan Cuti */}
        {activeTab === 'pengajuan' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="bg-white rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau alasan cuti..."
            value={searchPengajuan}
            onChange={(e) => handleSearchPengajuan(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {searchPengajuan && (
          <button
            onClick={() => handleSearchPengajuan('')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
        {/* ✅ BUTTON TAMBAH PENGAJUAN CUTI */}
        <button
          onClick={openFormModalAdminFromPengajuan}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Tambah Pengajuan Cuti
        </button>
      </div>
      {searchPengajuan && (
        <p className="text-sm text-gray-600 mt-2">
          Ditemukan {filteredPengajuanCuti.length} hasil dari pencarian "{searchPengajuan}"
        </p>
      )}
    </div>

      {searchPengajuan && (
        <p className="text-sm text-gray-600 mt-2">
          Ditemukan {filteredPengajuanCuti.length} hasil dari pencarian "{searchPengajuan}"
        </p>
      )}
    </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun Ke-</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Atasan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status HRD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Pimpinan</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPengajuanCuti.length > 0 ? (
                  paginatedPengajuanCuti.map((cuti, index) => (
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
    
    {/* ✅ BUTTON BARU: EDIT STATUS */}
    <button
      onClick={() => openEditStatusModal(cuti)}
      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
      title="Edit Status"
    >
      <Edit2 className="w-4 h-4" />
    </button>
    
    {/* ✅ UPDATED: Delete button - tidak perlu cek ditolak */}
    {cuti.status_final !== 'disetujui' && (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      {searchPengajuan ? 'Tidak ada hasil yang ditemukan' : 'Belum ada pengajuan cuti'}
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
              {/* Pagination untuk Pengajuan Cuti */}
{totalPagesPengajuan > 1 && (
  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
    <div className="text-sm text-gray-700">
      Menampilkan {(currentPagePengajuan - 1) * itemsPerPagePengajuan + 1} - {Math.min(currentPagePengajuan * itemsPerPagePengajuan, filteredPengajuanCuti.length)} dari {filteredPengajuanCuti.length} data
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => handlePageChangePengajuan(currentPagePengajuan - 1)}
        disabled={currentPagePengajuan === 1}
        className={`px-3 py-1 text-sm rounded ${
          currentPagePengajuan === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
        }`}
      >
        Previous
      </button>
      
      {[...Array(totalPagesPengajuan)].map((_, idx) => {
        const pageNum = idx + 1;
        // Show first page, last page, current page, and pages around current
        if (
          pageNum === 1 ||
          pageNum === totalPagesPengajuan ||
          (pageNum >= currentPagePengajuan - 1 && pageNum <= currentPagePengajuan + 1)
        ) {
          return (
            <button
              key={pageNum}
              onClick={() => handlePageChangePengajuan(pageNum)}
              className={`px-3 py-1 text-sm rounded ${
                currentPagePengajuan === pageNum
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {pageNum}
            </button>
          );
        } else if (
          pageNum === currentPagePengajuan - 2 ||
          pageNum === currentPagePengajuan + 2
        ) {
          return <span key={pageNum} className="px-2">...</span>;
        }
        return null;
      })}
      
      <button
        onClick={() => handlePageChangePengajuan(currentPagePengajuan + 1)}
        disabled={currentPagePengajuan === totalPagesPengajuan}
        className={`px-3 py-1 text-sm rounded ${
          currentPagePengajuan === totalPagesPengajuan
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
        }`}
      >
        Next
      </button>
    </div>
  </div>
)}
            </div>
          </div>
        )}
        


        {/* Modal Detail Pengajuan Cuti */}
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
        {/* Status Persetujuan dengan Hierarki */}
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
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      1
                    </div>
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
                  : !canApproveAsHRD(selectedCuti)
                  ? 'bg-gray-50 opacity-60'
                  : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                      {selectedCuti.diketahui_atasan ? '2' : '1'}
                    </div>
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

                {/* Pesan Hierarki */}
                {(() => {
                  const hierarchyMsg = getHierarchyMessage(selectedCuti, 'hrd');
                  return hierarchyMsg && selectedCuti.status_final === 'diproses' && (
                    <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      ⏳ {hierarchyMsg}
                    </div>
                  );
                })()}

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
                  : !canApproveAsPimpinan(selectedCuti)
                  ? 'bg-gray-50 opacity-60'
                  : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                      {(() => {
                        let level = 1;
                        if (selectedCuti.diketahui_atasan) level++;
                        if (selectedCuti.diketahui_hrd) level++;
                        return level;
                      })()}
                    </div>
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
                    
                {/* Pesan Hierarki */}
                {(() => {
                  const hierarchyMsg = getHierarchyMessage(selectedCuti, 'pimpinan');
                  return hierarchyMsg && selectedCuti.status_final === 'diproses' && (
                    <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      ⏳ {hierarchyMsg}
                    </div>
                  );
                })()}

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
            {formatDate(confirmAction.cuti?.tanggal_mulai)} - {formatDate(confirmAction.cuti?.tanggal_selesai)} ({confirmAction.cuti?.jumlah_hari} hari)
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
{showUserDetailModal && selectedUserGroup && (
  <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl shadow-lg">
            {selectedUserGroup.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-white">
            <h3 className="text-2xl font-bold">{selectedUserGroup.user?.name}</h3>
            <p className="text-blue-100">{selectedUserGroup.user?.email}</p>
            <p className="text-sm text-blue-200 mt-1">
              TMK: {formatDate(selectedUserGroup.user?.tmk)}
            </p>
          </div>
        </div>
        <button
          onClick={closeUserDetailModal}
          className="text-white hover:text-blue-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
       {/* TAMBAHAN: Informasi User dalam bentuk tabel - Periode Aktif */}
{(() => {
  const tmk = new Date(selectedUserGroup.user.tmk);
  const today = new Date();
  const yearsDiff = today.getFullYear() - tmk.getFullYear();
  const monthDiff = today.getMonth() - tmk.getMonth();
  const dayDiff = today.getDate() - tmk.getDate();
  
  let activePeriod = yearsDiff;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    activePeriod--;
  }
  
  const aktiveCuti = selectedUserGroup.cutiList.find(item => item.tahun_ke === activePeriod);
  const nextYearCuti = selectedUserGroup.cutiList.find(item => item.tahun_ke === (activePeriod + 1));
  
  // Hitung masa kerja detail
  let totalYears = yearsDiff;
  let totalMonths = monthDiff;
  let totalDays = dayDiff;
  
  if (totalDays < 0) {
    totalMonths--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    totalDays += prevMonth.getDate();
  }
  if (totalMonths < 0) {
    totalYears--;
    totalMonths += 12;
  }
  
  return (
    <div className="mb-6 bg-gray-50 rounded-lg p-4">
      <table className="w-full">
        <tbody className="text-sm">
          <tr className="border-b border-gray-200">
            <td className="py-2 text-gray-600 w-48">Tahun ke</td>
            <td className="py-2 text-gray-900">: {activePeriod}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 text-gray-600">TMK</td>
            <td className="py-2 text-gray-900">
              : {formatDate(selectedUserGroup.user?.tmk)} ({totalYears} tahun {totalMonths} bulan {totalDays} hari)
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 text-gray-600">Hak cuti sebenarnya</td>
            <td className="py-2 text-gray-900">
              : {formatCutiNumber(aktiveCuti?.jumlah_cuti || 0)} hari
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 text-gray-600">Dipinjam utk tahun ke 0</td>
            <td className="py-2 text-gray-900">: 0 hari</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 text-gray-600">Dapat dipinjam cuti tahun ke {activePeriod + 1}</td>
            <td className="py-2 text-gray-900">
              : {formatCutiNumber(nextYearCuti?.jumlah_cuti || 0)} hari
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 text-gray-600">Telah terpakai</td>
            <td className="py-2 text-gray-900">
              : {formatCutiNumber(aktiveCuti?.cuti_dipakai || 0)} hari
            </td>
          </tr>
          <tr className="bg-blue-50 border-b border-gray-200">
            <td className="py-2 text-gray-700 font-semibold">Sisa cuti</td>
            <td className="py-2 font-bold text-blue-600">
              : {formatCutiNumber(aktiveCuti?.sisa_cuti || 0)} hari
            </td>
          </tr>
          <tr>
            <td className="py-2 text-gray-600 align-top">Detail pemakaian</td>
            <td className="py-2 text-gray-900">
              : {(() => {
                const approvedCuti = pemakaianCuti.filter(c => 
                  parseInt(c.uid) === parseInt(selectedUserGroup.user.id) && 
                  c.status_final === 'disetujui'
                );
                if (approvedCuti.length === 0) {
                  return 'Belum ada cuti terpakai';
                }
                
                return (
                  <div className="space-y-1 ml-2">
                    {approvedCuti.map((cuti, idx) => (
                      <div key={idx} className="text-sm">
                        • {formatCutiNumber(cuti.jumlah_hari)} hari ({formatDate(cuti.tanggal_mulai)} - {formatDate(cuti.tanggal_selesai)})
                      </div>
                    ))}
                  </div>
                );
              })()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
})()}

        {/* Tabel Jatah Cuti per Periode */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Riwayat Jatah Cuti
            </h4>
           
          </div>
          
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tahun Ke-</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tahun</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jatah</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Terpakai</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sisa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedUserGroup.cutiList
                  .sort((a, b) => b.tahun_ke - a.tahun_ke)
                  .map((cuti) => {
                    // Hitung periode aktif
                    const tmk = new Date(selectedUserGroup.user.tmk);
                    const today = new Date();
                    const yearsDiff = today.getFullYear() - tmk.getFullYear();
                    const monthDiff = today.getMonth() - tmk.getMonth();
                    const dayDiff = today.getDate() - tmk.getDate();
                    let activePeriod = yearsDiff;
                    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                      activePeriod--;
                    }
                    const isActive = cuti.tahun_ke === activePeriod;
                    
                    return (
                      <tr key={cuti.id} className={isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{cuti.tahun_ke}</span>
                            {isActive && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                                Aktif
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">{cuti.tahun}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="font-semibold text-blue-600">{formatCutiNumber(cuti.jumlah_cuti)} hari</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="font-semibold text-red-600">{formatCutiNumber(cuti.cuti_dipakai)} hari</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className={`font-semibold ${parseFloat(cuti.sisa_cuti) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {formatCutiNumber(cuti.sisa_cuti)} hari
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {cuti.keterangan || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                closeUserDetailModal();
                                openModal('edit', cuti);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menghapus data jatah cuti ini?')) {
                                  handleDelete(cuti.id);
                                  closeUserDetailModal();
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Riwayat Pengajuan Cuti */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Riwayat Pengajuan Cuti
          </h4>
          
          <div className="space-y-3">
            {(() => {
              const userCutiHistory = pemakaianCuti.filter(
                c => parseInt(c.uid) === parseInt(selectedUserGroup.user.id)
              );
              
              return userCutiHistory.length > 0 ? (
                userCutiHistory
                  .sort((a, b) => new Date(b.tanggal_pengajuan) - new Date(a.tanggal_pengajuan))
                  .map((cuti) => (
                    <div 
                      key={cuti.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              {formatDate(cuti.tanggal_mulai)} - {formatDate(cuti.tanggal_selesai)}
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                              {cuti.jumlah_hari} hari
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{cuti.alasan}</p>
                          <p className="text-xs text-gray-500">
                            Diajukan: {formatDate(cuti.tanggal_pengajuan)}
                          </p>
                        </div>
                        <div className="ml-4">
                          {getStatusFinalBadge(cuti.status_final)}
                        </div>
                      </div>
                      
                      <div className="border-t pt-3 mt-3">
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-gray-500 mb-1">Atasan</p>
                            {cuti.status_diketahui_atasan ? (
                              getStatusBadge(cuti.status_diketahui_atasan)
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">HRD</p>
                            {cuti.status_diketahui_hrd ? (
                              getStatusBadge(cuti.status_diketahui_hrd)
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Pimpinan</p>
                            {cuti.status_disetujui ? (
                              getStatusBadge(cuti.status_disetujui)
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {cuti.catatan && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <p className="font-medium text-yellow-900 mb-1">Catatan:</p>
                          <p className="text-gray-700">{cuti.catatan}</p>
                        </div>
                      )}
                      
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            closeUserDetailModal();
                            openDetailModal(cuti);
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Detail
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(cuti.id)}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          PDF
                        </button>
                        {(cuti.status_final === 'ditolak' || cuti.status_final ==='diproses')&& (
                          <button
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus pengajuan cuti ini?')) {
                                handleDeletePengajuan(cuti.id);
                                closeUserDetailModal();
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Belum ada riwayat pengajuan cuti</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={closeUserDetailModal}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
)}

{showSelectUserModal && (
  <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-800">Pilih Karyawan</h3>
        </div>
        <button
          onClick={() => setShowSelectUserModal(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {/* Search Input */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama karyawan..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* User List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(() => {
            const groupedData = Object.values(
              jatahCuti.data.reduce((acc, item) => {
                const userId = item.user?.id;
                if (!acc[userId]) {
                  acc[userId] = { user: item.user, cutiList: [] };
                }
                acc[userId].cutiList.push(item);
                return acc;
              }, {})
            );

            const filteredUsers = groupedData.filter(userGroup => 
              !searchUser || userGroup.user?.name?.toLowerCase().includes(searchUser.toLowerCase())
            );

            return filteredUsers.length > 0 ? (
              filteredUsers.map((userGroup, idx) => (
                <button
                  key={idx}
                  onClick={() => selectUserAndOpenForm(userGroup)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {userGroup.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{userGroup.user?.name}</p>
                      <p className="text-sm text-gray-600">{userGroup.user?.email}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Tidak ada karyawan yang ditemukan</p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  </div>
)}

{/* ✅ MODAL FORM PENGAJUAN CUTI ADMIN */}
{showFormModalAdmin && selectedUserForCuti && (
  <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Ajukan Cuti untuk Karyawan</h3>
            <p className="text-sm text-gray-600">
              User: <strong>{selectedUserForCuti.user.name}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={closeFormModalAdmin}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmitAdmin} className="p-6 space-y-4">
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
            {jatahCutiForUser
              .filter(j => j.is_current)
              .map((jatah) => (
                <option key={jatah.id} value={jatah.id}>
                  Tahun ke-{jatah.tahun_ke} - Sisa: {formatCutiNumber(jatah.sisa_cuti)} hari
                </option>
              ))}
            {jatahCutiForUser
              .filter(j => j.is_borrowable)
              .map((jatah) => (
                <option key={jatah.id} value={jatah.id}>
                  Tahun ke-{jatah.tahun_ke} - Sisa: {formatCutiNumber(jatah.sisa_cuti)} hari (Pinjam periode depan)
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

        {/* Alur Persetujuan */}
        {/* Alur Persetujuan */}
<div className="border-t pt-4">
  <h4 className="text-sm font-semibold text-gray-700 mb-3">
    Alur Persetujuan <span className="text-red-500 text-xs">(Minimal pilih 1)</span>
  </h4>
  
  {/* ✅ TAMBAHAN BARU: Info User Yang Dipilih */}
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-center gap-2 text-sm">
      <User className="w-4 h-4 text-blue-600" />
      <span className="text-gray-700">
        Pengajuan cuti untuk: <strong className="text-blue-700">{selectedUserForCuti.user.name}</strong>
      </span>
    </div>
    <p className="text-xs text-gray-600 mt-1 ml-6">
      * User ini tidak dapat menjadi approver untuk dirinya sendiri
    </p>
  </div>
  
  <div className="space-y-3">
    {/* Diketahui Atasan */}
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
        {getAvailableApprovers(selectedUserForCuti.user.id).map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
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
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">Pilih HRD</option>
        {getAvailableApprovers(selectedUserForCuti.user.id).map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
    
    {/* Disetujui Pimpinan */}
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
        {getAvailableApprovers(selectedUserForCuti.user.id).map((user) => (
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
            onClick={closeFormModalAdmin}
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
{/* Modal Tambah/Edit Jatah Cuti */}
{/* ✅ MODAL BARU: EDIT STATUS LANGSUNG */}
{showEditStatusModal && selectedCutiForEdit && (
  <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto mx-5">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
        <div className="flex items-center gap-3">
          <Edit2 className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-800">Edit Status Pengajuan</h3>
        </div>
        <button
          onClick={() => {
            setShowEditStatusModal(false);
            setSelectedCutiForEdit(null);
            setEditStatusData({ status_final: '', catatan: '' });
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* Info Pengajuan */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Pengajuan dari:</p>
          <p className="font-semibold text-gray-900">{selectedCutiForEdit.user?.name}</p>
          <p className="text-sm text-gray-600 mt-1">
            {formatDate(selectedCutiForEdit.tanggal_mulai)} - {formatDate(selectedCutiForEdit.tanggal_selesai)} 
            ({selectedCutiForEdit.jumlah_hari} hari)
          </p>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Status saat ini: </span>
            {getStatusFinalBadge(selectedCutiForEdit.status_final)}
          </div>
        </div>

        {/* Pilih Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ubah Status Menjadi <span className="text-red-500">*</span>
          </label>
          <select
            value={editStatusData.status_final}
            onChange={(e) => setEditStatusData({ ...editStatusData, status_final: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Pilih Status</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan {editStatusData.status_final === 'ditolak' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={editStatusData.catatan}
            onChange={(e) => setEditStatusData({ ...editStatusData, catatan: e.target.value })}
            placeholder={
              editStatusData.status_final === 'disetujui' 
                ? 'Tambahkan catatan persetujuan (opsional)...' 
                : 'Alasan penolakan wajib diisi...'
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-none ${
              editStatusData.status_final === 'ditolak' 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-purple-500'
            }`}
            rows="4"
            maxLength="500"
          />
          {editStatusData.status_final === 'ditolak' && (
            <p className="text-xs text-red-600 mt-1">
              * Catatan wajib diisi saat menolak pengajuan
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {editStatusData.catatan.length}/500 karakter
          </p>
        </div>

        {/* Warning */}
        {editStatusData.status_final && (
          <div className={`p-3 rounded-lg ${
            editStatusData.status_final === 'disetujui' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm font-medium">⚠️ Peringatan:</p>
            <p className="text-xs mt-1">
              {editStatusData.status_final === 'disetujui' 
                ? 'Jatah cuti akan langsung dikurangi dan kehadiran akan diupdate.' 
                : 'Pengajuan akan langsung ditolak dan tidak dapat diubah lagi.'}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 p-6 border-t border-gray-200">
        <button
          onClick={() => {
            setShowEditStatusModal(false);
            setSelectedCutiForEdit(null);
            setEditStatusData({ status_final: '', catatan: '' });
          }}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSubmitEditStatus}
          disabled={!editStatusData.status_final}
          className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
            !editStatusData.status_final
              ? 'bg-gray-400 cursor-not-allowed'
              : editStatusData.status_final === 'disetujui'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Simpan Perubahan
        </button>
      </div>
    </div>
  </div>
)}
{showModal && (
  <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    {/* UBAH: max-w-md -> max-w-lg, TAMBAH: max-h-[85vh] overflow-y-auto */}
    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
      
      {/* UBAH: p-6 -> p-4, text-xl -> text-lg, w-6 h-6 -> w-5 h-5, TAMBAH: bg-blue-50 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
        <h3 className="text-lg font-semibold text-gray-800">
          {modalType === 'create' ? 'Tambah Jatah Cuti' : 'Edit Jatah Cuti'}
        </h3>
        <button
          onClick={closeModal}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* UBAH: p-6 space-y-4 -> p-4 space-y-3 */}
      <div className="p-4 space-y-3">
        
        {/* Pilih User - UBAH: mb-2 -> mb-1, px-4 py-2 -> px-3 py-2, TAMBAH: text-sm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pilih Karyawan <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.uid}
            onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            disabled={modalType === 'edit'}
          >
            <option value="">Pilih Karyawan</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tahun - UBAH: mb-2 -> mb-1, px-4 py-2 -> px-3 py-2, TAMBAH: text-sm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tahun <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.tahun}
            onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            disabled={modalType === 'edit'}
          />
        </div>

        {/* Button Hitung Cuti - UBAH: px-4 py-2 -> px-3 py-2, TAMBAH: text-sm */}
        {modalType === 'create' && formData.uid && formData.tahun && (
          <button
            type="button"
            onClick={calculateCuti}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Calculator className="w-4 h-4" />
            Hitung Jatah Cuti Otomatis
          </button>
        )}

        {/* Tahun Ke- - UBAH: mb-2 -> mb-1, px-4 py-2 -> px-3 py-2, TAMBAH: text-sm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tahun Ke-
          </label>
          <input
            type="number"
            value={formData.tahun_ke}
            readOnly
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>

        {/* Jumlah Cuti - UBAH: mb-2 -> mb-1, px-4 py-2 -> px-3 py-2, TAMBAH: text-sm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah Cuti (Hari) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.5"
            value={formData.jumlah_cuti}
            onChange={(e) => setFormData({ 
              ...formData, 
              jumlah_cuti: e.target.value,
              sisa_cuti: e.target.value 
            })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Keterangan - UBAH: mb-2 -> mb-1, rows="3" -> rows="2", px-4 py-2 -> px-3 py-2, TAMBAH: text-sm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keterangan
          </label>
          <textarea
            value={formData.keterangan}
            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
            rows="2"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Tambahkan catatan jika perlu..."
          />
        </div>
      </div>

      {/* Footer - UBAH: p-6 -> p-4, px-4 py-2 -> px-3 py-2, TAMBAH: text-sm */}
      <div className="flex gap-3 p-4 border-t border-gray-200">
        <button
          onClick={closeModal}
          className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {modalType === 'create' ? 'Simpan' : 'Update'}
        </button>
      </div>
    </div>
  </div>
)}
{loadingOverlay && (
  <div style={{margin:"0px", padding:"0px"}} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
        <div className="w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800 mb-1">Memproses</p>
        <p className="text-sm text-gray-600">Mohon tunggu sebentar...</p>
      </div>
    </div>
  </div>
)}
    </LayoutTemplate>
  );
}


export default Cuti;