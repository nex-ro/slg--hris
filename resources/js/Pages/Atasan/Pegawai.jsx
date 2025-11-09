import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { Pencil, Trash2, Plus, X, Upload, Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';


function Pegawai({ flash, filterDivisi }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  console.log(filterDivisi)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [users, setUsers] = useState({ data: [], links: [], total: 0, from: 0, to: 0, last_page: 1 });
const [divisiList, setDivisiList] = useState([]);
const [jabatanList, setJabatanList] = useState([]);
const [loading, setLoading] = useState(false);

const [searchTerm, setSearchTerm] = useState('');
const [selectedDivisi, setSelectedDivisi] = useState('');
const [selectedJabatan, setSelectedJabatan] = useState('');
const [selectedTower, setSelectedTower] = useState('');
const [currentPage, setCurrentPage] = useState(1);
  
useEffect(() => {
  fetchData(currentPage);
  
  const interval = setInterval(() => {
    fetchData(currentPage);
  }, 30000); // Refresh every 30 seconds
  
  return () => clearInterval(interval);
}, []);

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
  setSelectedDivisi(''); // Ini tetap direset
  setSelectedJabatan('');
  setSelectedTower('');
};


const fetchData = async (page = 1) => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    
    if (filterDivisi) {
      params.append('filterDivisi', filterDivisi);
    }
    if (selectedDivisi && !filterDivisi) {  // ✅ PERBAIKI INI (sebelumnya divisiFilter)
  params.append('divisi', selectedDivisi);
}
    
    if (searchTerm) params.append('search', searchTerm);
    
    // Hanya kirim selectedDivisi jika tidak ada divisiFilter
    if (selectedDivisi && !divisiFilter) {
      params.append('divisi', selectedDivisi);
    }
    
    if (selectedJabatan) params.append('jabatan', selectedJabatan);
    if (selectedTower) params.append('tower', selectedTower);
    params.append('page', page);

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
  disabled={divisiFilter} // Tambahkan ini
  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    filterDivisi ? 'bg-gray-100 cursor-not-allowed' : ''
  }`}
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
{/* Tabel Data Pegawai - TAMBAHKAN INI */}
<div className="bg-white rounded-lg shadow overflow-hidden">
  {loading ? (
    <div className="p-8 text-center">
      <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
      <p className="text-gray-500">Memuat data...</p>
    </div>
  ) : userData.length === 0 ? (
    <div className="p-8 text-center text-gray-500">
      <p>Tidak ada data pegawai</p>
    </div>
  ) : (
    <>
      <div className="overflow-x-auto">
       <table className="w-full">
  <thead className="bg-gray-50 border-b">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Divisi</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tower</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {userData.map((user, index) => (
      <tr key={user.id} className="hover:bg-gray-50 transition">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {users.from + index}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{user.name}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {user.email}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
            {user.divisi || '-'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {user.jabatan || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {user.tower || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {user.active ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => openEditModal(user)}
              className="text-blue-600 hover:text-blue-900 transition"
              title="Edit Pegawai"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleDelete(user.id)}
              className="text-red-600 hover:text-red-900 transition"
              title="Hapus Pegawai"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
      </div>

      {/* Pagination */}
      {users.last_page > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Menampilkan {users.from} sampai {users.to} dari {users.total} data
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 py-1 border rounded-lg bg-blue-50 text-blue-600">
              {currentPage}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === users.last_page}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  )}
</div>
        
      </div>
    </LayoutTemplate>
  );
}

export default Pegawai;