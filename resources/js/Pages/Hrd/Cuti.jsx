import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Calculator, CheckCircle, XCircle, Eye, Clock, User } from 'lucide-react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';

function Cuti({ jatahCuti, users, tahunList, filters = {}, pemakaianCuti = [], auth }) {
  console.log('Pemakaian Cuti Props:', pemakaianCuti); // Debug: log data yang diterima
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

  const formatCutiNumber = (num) => {
    return parseFloat(num || 0).toFixed(2);
  };

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
  const cuti = pemakaianCuti.find(c => c.id === cutiId);
  if (cuti && (cuti.status_final === 'ditolak' || cuti.status_final === 'disetujui')) {
    alert('Status pengajuan ini sudah final dan tidak dapat diubah lagi.');
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

const openUserDetailModal = (userGroup) => {
  setSelectedUserGroup(userGroup);
  setShowUserDetailModal(true);
};

const closeUserDetailModal = () => {
  setShowUserDetailModal(false);
  setSelectedUserGroup(null);
};
const submitApproval = () => {
  if (!confirmAction) return;

  // Validasi catatan wajib untuk penolakan
  if (confirmAction.status === 'ditolak' && !catatan.trim()) {
    alert('Catatan wajib diisi saat menolak pengajuan cuti');
    return;
  }

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


const pemakaianCutiArray = pemakaianCuti || [];

const pendingApprovals = pemakaianCutiArray.filter(cuti => {
  if (cuti.status_final !== 'diproses') return false;
  
  const isAtasan = cuti.diketahui_atasan === currentUserId && cuti.status_diketahui_atasan === 'diproses';
  const isHRD = cuti.diketahui_hrd === currentUserId && cuti.status_diketahui_hrd === 'diproses';
  const isPimpinan = cuti.disetujui === currentUserId && cuti.status_disetujui === 'diproses';
  
  return isAtasan || isHRD || isPimpinan;
}).length || 0;

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
  </div>
    </div>



        {activeTab === 'jatah' && (
          <>
           <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
                      <div className="p-5">
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
                              {formatCutiNumber(totalJatah)}
                            </p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-1">Terpakai</p>
                            <p className="text-lg font-bold text-red-600">
                              {formatCutiNumber(totalTerpakai)}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-1">Sisa</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatCutiNumber(totalSisa)}
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
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
          <button
            onClick={() => openDetailModal(cuti)}
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
        

        {/* Modal Form Jatah Cuti */}
        {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}>
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
      {/* Modal Konfirmasi Approval */}
{showConfirmModal && confirmAction && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {selectedUserGroup.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{selectedUserGroup.user?.name}</h3>
            <p className="text-sm text-gray-600">{selectedUserGroup.user?.email}</p>
          </div>
        </div>
        <button
          onClick={closeUserDetailModal}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {(() => {
          // Filter hanya periode aktif
          const tmk = new Date(selectedUserGroup.user.tmk);
          const today = new Date();
          const yearsDiff = today.getFullYear() - tmk.getFullYear();
          const monthDiff = today.getMonth() - tmk.getMonth();
          const dayDiff = today.getDate() - tmk.getDate();
          
          let activePeriod = yearsDiff;
          if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            activePeriod--;
          }
          
          const aktiveCuti = selectedUserGroup.cutiList.filter(item => item.tahun_ke >= activePeriod);
          
          // Hitung masa kerja detail
          const tmkDate = new Date(selectedUserGroup.user.tmk);
          const diffTime = Math.abs(today - tmkDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const years = Math.floor(diffDays / 365);
          const remainingDays = diffDays % 365;
          const months = Math.floor(remainingDays / 30);
          const days = remainingDays % 30;
          
          
          const totalJatah = aktiveCuti.reduce((sum, item) => sum + parseFloat(item.jumlah_cuti || 0), 0);
          const totalTerpakai = aktiveCuti.reduce((sum, item) => sum + parseFloat(item.cuti_dipakai || 0), 0);
          const totalSisa = aktiveCuti.reduce((sum, item) => sum + parseFloat(item.sisa_cuti || 0), 0);
          
          // Cari periode aktif (tahun_ke == activePeriod)
          const periodeAktif = aktiveCuti.find(item => item.tahun_ke === activePeriod);
          const periodeNext = aktiveCuti.find(item => item.tahun_ke === activePeriod + 1);
          const periodePrev = selectedUserGroup.cutiList.find(item => item.tahun_ke === activePeriod - 1);
          
          return (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                <h4 className="text-lg font-bold mb-4">Informasi Jatah Cuti</h4>
                
                <div className="space-y-3">
                  {/* Tahun ke */}
                  <div className="flex justify-between items-center pb-2 border-b border-blue-400">
                    <span className="text-blue-100">Tahun ke</span>
                    <span className="font-semibold">: {activePeriod}</span>
                  </div>

                  {/* TMK */}
                  <div className="flex justify-between items-center pb-2 border-b border-blue-400">
                    <span className="text-blue-100">TMK</span>
                    <span className="font-semibold">
                      : {formatDate(selectedUserGroup.user.tmk)} ({years} tahun {months} bulan {days} hari)
                    </span>
                  </div>

                  {/* Hak cuti sebenarnya */}
                  <div className="flex justify-between items-center pb-2 border-b border-blue-400">
                    <span className="text-blue-100">Hak cuti sebenarnya</span>
                    <span className="font-semibold">: {formatCutiNumber(periodeAktif?.jumlah_cuti || 0)} hari</span>
                  </div>

                  {/* Dipinjam utk tahun ke prev */}
                  {periodePrev && (
                    <div className="flex justify-between items-center pb-2 border-b border-blue-400">
                      <span className="text-blue-100">Dipinjam utk tahun ke {activePeriod - 1}</span>
                      <span className="font-semibold">: {formatCutiNumber(periodePrev?.pinjam_tahun_next || 0)} hari</span>
                    </div>
                  )}

                  {/* Dapat dipinjam cuti tahun ke next */}
                  {periodeNext && (
                    <div className="flex justify-between items-center pb-2 border-b border-blue-400">
                      <span className="text-blue-100">Dapat dipinjam cuti tahun ke {activePeriod + 1}</span>
                      <span className="font-semibold">: {formatCutiNumber(periodeNext?.sisa_cuti || 0)} hari</span>
                    </div>
                  )}

                  {/* Telah terpakai */}
                  <div className="flex justify-between items-center pb-2 border-b border-blue-400">
                    <span className="text-blue-100">Telah terpakai</span>
                    <span className="font-semibold">: {formatCutiNumber(periodeAktif?.cuti_dipakai || 0)} hari</span>
                  </div>

                  {/* Sisa cuti */}
                  <div className="flex justify-between items-center pb-2 border-b-2 border-blue-300">
                    <span className="text-blue-100 font-bold">Sisa cuti</span>
                    <span className="font-bold text-xl text-yellow-300">
                      : {formatCutiNumber(periodeAktif?.sisa_cuti || 0)} hari
                    </span>
                  </div>

                  {/* Telah terpakai dengan detail */}
                                   <div className="pb-2 border-b border-blue-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-blue-100">Telah terpakai</span>
                      <span className="font-semibold">: {formatCutiNumber(periodeAktif?.cuti_dipakai || 0)} hari</span>
                    </div>
                    {(() => {
                      // Filter penggunaan cuti yang sudah disetujui untuk periode aktif ini
                      const cutiDipakai = periodeAktif?.pemakaian?.filter(p => p.status_final === 'disetujui') || [];
                      
                      return cutiDipakai.length > 0 && (
                        <div className="ml-4 mt-2 space-y-1">
                          {cutiDipakai.map((cuti, idx) => (
                            <div key={idx} className="text-sm text-blue-100">
                              • {formatCutiNumber(cuti.jumlah_hari)} hari ({formatDate(cuti.tanggal_mulai)} - {formatDate(cuti.tanggal_selesai)})
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Detail Per Periode */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Detail Jatah Cuti Per Periode</h4>
                <div className="space-y-3">
                  {aktiveCuti.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-semibold text-gray-800">
                          Periode {item.tahun_ke} - Tahun {item.tahun}
                          {item.tahun_ke === activePeriod && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Aktif
                            </span>
                          )}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openModal('edit', item)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-white rounded p-2">
                          <p className="text-xs text-gray-500">Jatah</p>
                          <p className="text-lg font-semibold text-blue-600">{formatCutiNumber(item.jumlah_cuti)} hari</p>
                        </div>
                        <div className="bg-white rounded p-2">
                          <p className="text-xs text-gray-500">Terpakai</p>
                          <p className="text-lg font-semibold text-red-600">{formatCutiNumber(item.cuti_dipakai)} hari</p>
                        </div>
                        <div className="bg-white rounded p-2">
                          <p className="text-xs text-gray-500">Sisa</p>
                          <p className="text-lg font-semibold text-green-600">{formatCutiNumber(item.sisa_cuti)} hari</p>
                        </div>
                      </div>
                      {item.keterangan && (
                        <p className="text-xs text-gray-500 italic bg-yellow-50 p-2 rounded">
                          📝 {item.keterangan}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Riwayat Penggunaan Cuti */}
             
            </>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white">
        <button
          onClick={closeUserDetailModal}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
)}
    </LayoutTemplate>
  );
}


export default Cuti;